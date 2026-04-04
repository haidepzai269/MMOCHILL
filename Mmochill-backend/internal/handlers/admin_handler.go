package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func GetAdminStats(c *gin.Context) {
	ctx := c.Request.Context()
	const cacheKey = "admin:stats:v1"

	// Check Redis Cache trước (TTL 2 phút)
	if val, err := database.RedisClient.Get(ctx, cacheKey).Result(); err == nil {
		var stats map[string]interface{}
		if json.Unmarshal([]byte(val), &stats) == nil {
			c.JSON(http.StatusOK, stats)
			return
		}
	}

	stats, err := repository.GetAdminStats(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}

	// Lưu vào Redis Cache (2 phút)
	if statsJSON, err := json.Marshal(stats); err == nil {
		database.RedisClient.Set(ctx, cacheKey, statsJSON, 2*time.Minute)
	}

	c.JSON(http.StatusOK, stats)
}

func GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.DefaultQuery("search", "")
	filter := c.DefaultQuery("filter", "")
	offset := (page - 1) * limit
	ctx := c.Request.Context()

	// Priority 6c: Cache admin users listing (TTL 2 phút)
	usersVersion, _ := database.RedisClient.Get(ctx, "admin:users:version").Result()
	if usersVersion == "" {
		usersVersion = "1"
	}
	cacheKey := fmt.Sprintf("admin:users:p:%d:l:%d:s:%s:f:%s:v:%s", page, limit, search, filter, usersVersion)
	if val, err := database.RedisClient.Get(ctx, cacheKey).Result(); err == nil {
		var result map[string]interface{}
		if json.Unmarshal([]byte(val), &result) == nil {
			c.JSON(http.StatusOK, result)
			return
		}
	}

	users, total, err := repository.GetAllUsers(ctx, limit, offset, search, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := gin.H{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
	}

	// Lưu vào cache
	if respJSON, err := json.Marshal(result); err == nil {
		database.RedisClient.Set(ctx, cacheKey, respJSON, 2*time.Minute)
	}

	c.JSON(http.StatusOK, result)
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
	// Invalidate admin stats cache, profile cache của user bị ban, và admin users cache
	database.RedisClient.Del(ctx, "admin:stats:v1")
	database.RedisClient.Del(ctx, "user:profile:"+id)
	database.RedisClient.Incr(ctx, "admin:users:version") // bump version để invalidate toàn bộ users cache

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
	// Invalidate admin stats cache
	database.RedisClient.Del(ctx, "admin:stats:v1")

	// Notify User
	w, _ := repository.GetWithdrawalByID(ctx, id)
	if w != nil {
		noteMsg := "ADMIN đã bank thành công , yêu cầu bạn check lại ngân hàng"
		_ = repository.CreateNotification(ctx, nil, w.UserID, "Yêu cầu rút tiền", noteMsg, "success", "system")
		database.RedisClient.Publish(ctx, "notifications:user:"+w.UserID, "update")

		// Thông báo cho admin
		adminID := c.GetString("user_id")
		adminTitle := "Duyệt tiền thành công"
		adminMsg := fmt.Sprintf("Admin ID %s đã duyệt thành công %d VND cho user %s", adminID, w.Amount, w.UserID)
		_ = repository.CreateAdminNotification(ctx, nil, adminTitle, adminMsg, "success", "payment", map[string]interface{}{"withdrawal_id": id, "admin_id": adminID})
		database.RedisClient.Publish(ctx, "admin:notifications", "update")
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
	// Invalidate admin stats cache
	database.RedisClient.Del(ctx, "admin:stats:v1")

	// Notify User
	w, _ := repository.GetWithdrawalByID(ctx, id)
	if w != nil {
		_ = repository.CreateNotification(ctx, nil, w.UserID, "Yêu cầu rút tiền", "Yêu cầu rút tiền ID " + id + " đã bị từ chối.", "error", "system")
		database.RedisClient.Publish(ctx, "notifications:user:"+w.UserID, "update")
	}

	c.JSON(http.StatusOK, gin.H{"message": "Withdrawal rejected", "id": id})
}
func GetAdminClaims(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	claims, total, err := repository.GetAllClaims(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"claims": claims,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}
func GetAdminAlerts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	category := c.Query("category")
	offset := (page - 1) * limit

	ctx := c.Request.Context()
	alerts, total, err := repository.GetAdminNotifications(ctx, limit, offset, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var unreadCount int
	database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM admin_notifications WHERE is_read = false").Scan(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"alerts":       alerts,
		"total":        total,
		"unread_count": unreadCount,
		"page":         page,
		"limit":        limit,
	})
}

func MarkAdminAlertsAsRead(c *gin.Context) {
	var req struct {
		IDs []string `json:"ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		// If empty, mark all as read is handled by repository
	}

	ctx := c.Request.Context()
	if err := repository.MarkAdminNotificationsAsRead(ctx, req.IDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.RedisClient.Publish(ctx, "admin:notifications", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Notifications marked as read"})
}
