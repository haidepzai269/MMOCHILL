package handlers

import (
	"net/http"
	"strconv"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

type GlobalNotificationRequest struct {
	Title    string `json:"title" binding:"required"`
	Message  string `json:"message" binding:"required"`
	Type     string `json:"type"`     // severity: info, success, warning, error
	Category string `json:"category"` // system, task
}

func AdminCreateGlobalNotification(c *gin.Context) {
	var req GlobalNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Type == "" {
		req.Type = "info"
	}
	if req.Category == "" {
		req.Category = "system"
	}

	ctx := c.Request.Context()
	err := repository.CreateGlobalNotification(ctx, req.Title, req.Message, req.Type, req.Category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create global notification"})
		return
	}

	// Increment global notification version to invalidate all user caches
	database.RedisClient.Incr(ctx, "notes:v1:global_version")
	// Notify all connected users via SSE global signal
	database.RedisClient.Publish(ctx, "notifications:global", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Global notification sent successfully"})
}

func AdminGetSentNotifications(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	ctx := c.Request.Context()
	notes, total, err := repository.AdminGetSentNotifications(ctx, limit, offset)
	if err != nil {
		log.Printf("[AdminNotifications] Error fetching notifications: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sent notifications: " + err.Error()})
		return
	}

	log.Printf("[AdminNotifications] Page %d, Limit %d -> Found %d notifications (Total: %d)", page, limit, len(notes), total)

	c.JSON(http.StatusOK, models.AdminNotificationResponse{
		Notifications: notes,
		Total:         total,
	})
}


func AdminDeleteNotification(c *gin.Context) {
	id := c.Query("id")
	groupID := c.Query("group_id")
	ctx := c.Request.Context()

	if id == "" && groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id or group_id is required"})
		return
	}

	err := repository.AdminDeleteNotification(ctx, id, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	// Invalidate global version or individual cache? 
	// For simplicity, increment global version to force everyone to re-fetch
	database.RedisClient.Incr(ctx, "notes:v1:global_version")
	
	// Notify SSE: tell clients some notifications were deleted
	// We use "update" which forces a refetch, effectively "deleting" the vanished items from UI
	database.RedisClient.Publish(ctx, "notifications:global", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}

func AdminBulkDeleteNotification(c *gin.Context) {
	var req struct {
		IDs      []string `json:"ids"`
		GroupIDs []string `json:"group_ids"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) == 0 && len(req.GroupIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one id or group_id is required"})
		return
	}

	ctx := c.Request.Context()
	err := repository.AdminBulkDeleteNotifications(ctx, req.IDs, req.GroupIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to bulk delete notifications"})
		return
	}

	// Invalidate global version
	database.RedisClient.Incr(ctx, "notes:v1:global_version")
	// Notify SSE
	database.RedisClient.Publish(ctx, "notifications:global", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Bulk notifications deleted successfully"})
}
