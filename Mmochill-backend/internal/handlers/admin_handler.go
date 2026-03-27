package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func GetAdminStats(c *gin.Context) {
	stats, err := repository.GetAdminStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.DefaultQuery("search", "")
	offset := (page - 1) * limit

	users, total, err := repository.GetAllUsers(c.Request.Context(), limit, offset, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func BanUser(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Action string `json:"action" binding:"required"` // "ban" or "unban"
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("[Admin] BanUser Request: ID=%s, Action=%s\n", id, req.Action)

	status := "active"
	if req.Action == "ban" {
		status = "banned"
	}

	ctx := c.Request.Context()
	if err := repository.UpdateUserStatus(ctx, id, status); err != nil {
		fmt.Printf("[Admin] BanUser DB Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database update failed: " + err.Error()})
		return
	}

	fmt.Printf("[Admin] BanUser DB Success, updating cache and notifying...\n")

	// Update Redis Cache for status
	redisKey := fmt.Sprintf("user:status:%s", id)
	if status == "banned" {
		database.RedisClient.Set(ctx, redisKey, "banned", 0)
		database.RedisClient.Publish(ctx, "notifications:user:"+id, "kick_out")
	} else {
		database.RedisClient.Del(ctx, redisKey)
		database.RedisClient.Publish(ctx, "notifications:user:"+id, "unbanned")
	}

	// Logging
	adminID := c.GetString("user_id")
	_ = repository.CreateAuditLog(ctx, &models.AuditLog{
		AdminID:   adminID,
		Action:    req.Action + "_user",
		TargetID:  id,
		Details:   "Admin changed user status to " + status,
		IPAddress: c.ClientIP(),
	})

	// Notify SSE
	database.RedisClient.Publish(ctx, "admin:users", "update")
	database.RedisClient.Publish(ctx, "admin:stats", "update")

	// Create Notification for the user
	noteTitle := "Cập nhật trạng thái tài khoản"
	noteMsg := "Tài khoản của bạn đã được chuyển sang trạng thái: " + status
	_ = repository.CreateNotification(ctx, nil, id, noteTitle, noteMsg, "warning", "system")
	database.RedisClient.Publish(ctx, "notifications:user:"+id, "update")

	c.JSON(http.StatusOK, gin.H{
		"message": "User status updated successfully", 
		"status": status,
		"success": true,
	})
}

func GetAdminWithdrawals(c *gin.Context) {
	status := c.Query("status") // optional filter
	withdrawals, err := repository.GetAllWithdrawals(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, withdrawals)
}

func GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	logs, err := repository.GetAuditLogs(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}

func ApproveWithdrawal(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()
	if err := repository.UpdateWithdrawalStatus(ctx, id, "approved"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve: " + err.Error()})
		return
	}
	
	database.RedisClient.Publish(ctx, "admin:withdrawals", "update")
	database.RedisClient.Publish(ctx, "admin:stats", "update")

	// Notify User
	w, _ := repository.GetWithdrawalByID(ctx, id)
	if w != nil {
		noteMsg := "ADMIN đã bank thành công , yêu cầu bạn check lại ngân hàng"
		_ = repository.CreateNotification(ctx, nil, w.UserID, "Yêu cầu rút tiền", noteMsg, "success", "system")
		database.RedisClient.Publish(ctx, "notifications:user:"+w.UserID, "update")
	}

	c.JSON(http.StatusOK, gin.H{"message": "Withdrawal approved", "id": id})
}

func RejectWithdrawal(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()
	if err := repository.UpdateWithdrawalStatus(ctx, id, "rejected"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject: " + err.Error()})
		return
	}

	database.RedisClient.Publish(ctx, "admin:withdrawals", "update")
	database.RedisClient.Publish(ctx, "admin:stats", "update")

	// Notify User
	w, _ := repository.GetWithdrawalByID(ctx, id)
	if w != nil {
		_ = repository.CreateNotification(ctx, nil, w.UserID, "Yêu cầu rút tiền", "Yêu cầu rút tiền ID " + id + " đã bị từ chối.", "error", "system")
		database.RedisClient.Publish(ctx, "notifications:user:"+w.UserID, "update")
	}

	c.JSON(http.StatusOK, gin.H{"message": "Withdrawal rejected", "id": id})
}
