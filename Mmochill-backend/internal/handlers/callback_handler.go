package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func BypassCallback(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	ctx := c.Request.Context()

	// 1. Idempotency check với Redis SETNX
	lockKey := "bypass_lock:" + token
	ok, err := database.RedisClient.SetNX(ctx, lockKey, "1", 0).Result()
	if err != nil || !ok {
		c.JSON(http.StatusConflict, gin.H{"error": "Request already being processed or processed"})
		return
	}
	// Đặt expiry cho lock (ví dụ 10 phút)
	database.RedisClient.Expire(ctx, lockKey, 10*60*1e9)

	// 2. Lấy thông tin claim từ DB
	claim, err := repository.GetClaimByToken(ctx, token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid token"})
		return
	}

	if claim.Status != models.ClaimPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task already processed or expired"})
		return
	}

	// 2.5 Lấy thông tin Task để có Reward và OriginalURL
	task, err := repository.GetTaskByID(ctx, claim.TaskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Associated task not found"})
		return
	}

	// 3. Xử lý Transaction cộng tiền
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback(ctx)

	err = repository.AddReward(ctx, tx, claim.UserID, task.Reward, claim.ID, "Hoàn thành nhiệm vụ vượt link: "+task.Title)
	if err != nil {
		log.Printf("Callback Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wallet"})
		return
	}

	// Tạo thông báo cho user
	msg := fmt.Sprintf("Bạn đã nhận được %d VND từ nhiệm vụ: %s", task.Reward, task.Title)
	_ = repository.CreateNotification(ctx, tx, claim.UserID, "Nhiệm vụ hoàn tất", msg, "success", "task")

	err = repository.UpdateClaimStatus(ctx, tx, claim.ID, models.ClaimCompleted)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update claim status"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Invalidate Notification Cache
	database.RedisClient.Del(ctx, "notes:v1:user:"+claim.UserID)
	// Notify SSE
	database.RedisClient.Publish(ctx, "notifications:user:"+claim.UserID, "update")
	database.RedisClient.Publish(ctx, "admin:stats", "update")

	// Invalidate Available Tasks Cache for this user
	version, _ := database.RedisClient.Get(ctx, "tasks:v1:global_version").Result()
	if version == "" {
		version = "1"
	}
	database.RedisClient.Del(ctx, fmt.Sprintf("tasks:v1:user_available:%s:%s", claim.UserID, version))

	// Redirect user về link gốc của nhiệm vụ (ví dụ: bookingshows.vercel.app)
	if task.OriginalURL != "" {
		c.Redirect(http.StatusFound, task.OriginalURL)
	} else {
		frontendURL := os.Getenv("FRONTEND_URL")
		c.Redirect(http.StatusFound, frontendURL+"/dashboard/tasks?status=success")
	}
}
