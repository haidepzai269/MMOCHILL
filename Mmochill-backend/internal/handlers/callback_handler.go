package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func BypassCallback(c *gin.Context) {
	token := c.Query("token")
	fmt.Printf("[Callback] Nhận được Token: %s\n", token)

	// Tạo context nền với timeout 15 giây để đảm bảo logic cộng tiền luôn hoàn tất 
	// ngay cả khi đối tác (Traffic68) ngắt kết nối sớm.
	bgCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 1. Idempotency check với Redis SETNX
	lockKey := "bypass_lock:" + token
	ok, err := database.RedisClient.SetNX(bgCtx, lockKey, "1", 2*time.Minute).Result()
	if err != nil || !ok {
		// Tìm lại claim để lấy TaskID cho việc redirect
		claim, err := repository.GetClaimByToken(bgCtx, token)
		if err == nil {
			renderRedirect(c, claim.TaskID)
			return
		}
		c.JSON(http.StatusConflict, gin.H{"error": "Yêu cầu này đang được xử lý hoặc đã hoàn thành"})
		return
	}

	// 2. Lấy thông tin claim từ DB
	claim, err := repository.GetClaimByToken(bgCtx, token)
	if err != nil {
		fmt.Printf("[Callback] Lỗi truy vấn Token từ DB: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Mã xác thực không hợp lệ hoặc không tồn tại trong hệ thống",
			"details": err.Error(),
		})
		return
	}

	// Nếu nhiệm vụ đã hoàn thành trước đó (do duplicate request đã xử lý xong), 
	// vẫn cho phép redirect về dashboard.
	if claim.Status == models.ClaimCompleted {
		renderRedirect(c, claim.TaskID)
		return
	}

	if claim.Status != models.ClaimPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nhiệm vụ này không thể xử lý (Trạng thái không hợp lệ)"})
		return
	}

	// 2.5 Lấy thông tin Task để có Reward
	task, err := repository.GetTaskByID(bgCtx, claim.TaskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nhiệm vụ không tồn tại"})
		return
	}

	// 3. Xử lý Transaction cộng tiền
	tx, err := database.Pool.Begin(bgCtx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi hệ thống (TX)"})
		return
	}
	defer tx.Rollback(bgCtx)

	err = repository.AddReward(bgCtx, tx, claim.UserID, task.Reward, claim.ID, "Hoàn thành nhiệm vụ vượt link: "+task.Title)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật số dư"})
		return
	}

	// Tạo thông báo cho user
	msg := fmt.Sprintf("Chúc mừng! Bạn đã nhận được %d VND từ nhiệm vụ: %s", task.Reward, task.Title)
	_ = repository.CreateNotification(bgCtx, tx, claim.UserID, "Nhiệm vụ hoàn tất", msg, "success", "task")

	// 3.1 Xử lý hoa hồng Referral (10%)
	user, err := repository.GetUserByID(claim.UserID)
	if err == nil && user.ReferredBy != nil && *user.ReferredBy != "" {
		bonus := int64(float64(task.Reward) * 0.1)
		if bonus > 0 {
			errBonus := repository.AddWalletBalance(bgCtx, tx, *user.ReferredBy, bonus, models.TxReferralBonus, claim.ID, fmt.Sprintf("Hoa hồng 10%% từ bạn bè (%s) hoàn thành nhiệm vụ: %s", user.Username, task.Title))
			if errBonus == nil {
				// Thông báo cho người giới thiệu
				refMsg := fmt.Sprintf("Bạn nhận được %d VND hoa hồng từ bạn bè hoàn thành nhiệm vụ: %s", bonus, task.Title)
				_ = repository.CreateNotification(bgCtx, tx, *user.ReferredBy, "Hoa hồng giới thiệu", refMsg, "info", "referral")
				
				// Real-time update cho người giới thiệu ở cuối handler
			}
		}
	}

	err = repository.UpdateClaimStatus(bgCtx, tx, claim.ID, models.ClaimCompleted)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật trạng thái nhiệm vụ"})
		return
	}

	if err := tx.Commit(bgCtx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi commit dữ liệu"})
		return
	}

	// 3.5 Cập nhật Rate Limit IP (Chỉ tính khi hoàn thành thực tế)
	taskProvider := task.Provider
	if taskProvider == "" || taskProvider == "manual" {
		taskProvider = "taplayma"
	}
	if taskProvider == "taplayma" || taskProvider == "nhapma" || taskProvider == "traffic68" {
		today := time.Now().Format("20060102")
		rateLimitKey := fmt.Sprintf("rate_limit:ip:%s:task:%s:%s", claim.IPAddress, claim.TaskID, today)
		database.RedisClient.Incr(bgCtx, rateLimitKey)
		database.RedisClient.Expire(bgCtx, rateLimitKey, 24*time.Hour)
	}

	// 4. Thông báo Real-time cho User và Admin
	database.RedisClient.Del(bgCtx, "notes:v1:user:"+claim.UserID)
	database.RedisClient.Publish(bgCtx, "notifications:user:"+claim.UserID, "update")
	if user != nil && user.ReferredBy != nil && *user.ReferredBy != "" {
		database.RedisClient.Publish(bgCtx, "notifications:user:"+*user.ReferredBy, "update")
	}
	database.RedisClient.Publish(bgCtx, "admin:stats", "update")
	database.RedisClient.Publish(bgCtx, "admin:claims", "update")
	
	// Thông báo cho admin
	adminTitle := "User vượt task thành công"
	adminMsg := fmt.Sprintf("User %s đã hoàn thành task '%s' (ID: %s) và nhận %d VND", user.Username, task.Title, task.ID, task.Reward)
	_ = repository.CreateAdminNotification(bgCtx, tx, adminTitle, adminMsg, "success", "task", map[string]interface{}{"task_id": task.ID, "user_id": claim.UserID, "claim_id": claim.ID})
	database.RedisClient.Publish(bgCtx, "admin:notifications", "update")

	// Invalidate Available Tasks Cache for this user
	database.RedisClient.Incr(bgCtx, "tasks:v1:global_version")

	// 5. Redirect user về trang /tasks trên frontend
	renderRedirect(c, claim.TaskID)
}

// renderRedirect hỗ trợ trả về HTML chuyển hướng người dùng về trang Dashboard
func renderRedirect(c *gin.Context, taskID string) {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	redirectURL := frontendURL + "/tasks?status=success&completed_task_id=" + taskID

	html := fmt.Sprintf(`
		<html>
			<head><title>Redirecting...</title></head>
			<body>
				<p>Đang hoàn tất nhiệm vụ, vui lòng đợi trong giây lát...</p>
				<script>window.location.href = "%s";</script>
			</body>
		</html>
	`, redirectURL)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
