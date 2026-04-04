package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
	"strconv"
)

func GetNotifications(c *gin.Context) {
	userID := c.GetString("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit
	ctx := c.Request.Context()

	// Try Redis Cache with Pagination
	version, _ := database.RedisClient.Get(ctx, "notes:v1:global_version").Result()
	if version == "" {
		version = "1"
	}
	cacheKey := fmt.Sprintf("notes:v2:u:%s:p:%d:l:%d:v:%s", userID, page, limit, version)
	val, err := database.RedisClient.Get(ctx, cacheKey).Result()

	if err == nil {
		var result map[string]interface{}
		if json.Unmarshal([]byte(val), &result) == nil {
			c.JSON(http.StatusOK, result)
			return
		}
	}

	// Cache Miss
	notes, total, err := repository.GetNotificationsByUserID(ctx, userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var unreadCount int
	database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false", userID).Scan(&unreadCount)

	response := gin.H{
		"notifications": notes,
		"total":         total,
		"unread_count":  unreadCount,
		"page":          page,
		"limit":         limit,
	}

	// Save to Redis (TTL 5 mins)
	if notesJSON, err := json.Marshal(response); err == nil {
		database.RedisClient.Set(ctx, cacheKey, notesJSON, 5*time.Minute)
	}

	c.JSON(http.StatusOK, response)
}

func MarkAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")
	ctx := c.Request.Context()

	if err := repository.MarkNotificationAsRead(ctx, id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Redis Cache: increment global_version để bust toàn bộ cache notification
	// (format key cũ "notes:v1:user:..." đã bị thay bằng "notes:v2:u:...:v:{version}")
	database.RedisClient.Incr(ctx, "notes:v1:global_version")

	// Notify SSE
	database.RedisClient.Publish(ctx, "notifications:user:"+userID, "update")

	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}

func MarkNotificationsAllRead(c *gin.Context) {
	userID := c.GetString("user_id")
	ctx := c.Request.Context()

	if err := repository.MarkAllNotificationsAsRead(ctx, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Redis Cache: increment global_version để bust toàn bộ cache notification
	database.RedisClient.Incr(ctx, "notes:v1:global_version")

	// Notify SSE
	database.RedisClient.Publish(ctx, "notifications:user:"+userID, "update")

	c.JSON(http.StatusOK, gin.H{"message": "All marked as read"})
}

func StreamNotifications(c *gin.Context) {
	userID := c.GetString("user_id")
	fmt.Printf("[SSE] New connection attempt for user: %s\n", userID)
	if userID == "" {
		fmt.Printf("[SSE] Rejecting connection: No user_id in context\n")
		return
	}

	// Set Headers for SSE
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	ctx := c.Request.Context()
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		return
	}

	// Subscribe to Redis PubSub
	channels := []string{"notifications:user:" + userID, "tasks:global", "notifications:global"}

	// If user is admin, also listen to admin notifications
	role, _ := c.Get("role")
	userRole, _ := role.(string)
	if userRole == "admin" {
		channels = append(channels, "notifications:admin")
	}

	fmt.Printf("[SSE] User %s (Role: %s) subscribing to channels: %v\n", userID, userRole, channels)
	pubsub := database.RedisClient.Subscribe(ctx, channels...)
	defer pubsub.Close()

	// Priority 4: Check Redis Cache for initial SSE push
	version, _ := database.RedisClient.Get(ctx, "notes:v1:global_version").Result()
	if version == "" {
		version = "1"
	}
	initCacheKey := fmt.Sprintf("notes:v2:u:%s:p:1:l:10:v:%s", userID, version)

	var initialResponseStr string
	if val, err := database.RedisClient.Get(ctx, initCacheKey).Result(); err == nil {
		// Cache hit: gửi luôn không cần query DB
		initialResponseStr = val
	} else {
		// Cache miss: query DB
		initialNotes, total, _ := repository.GetNotificationsByUserID(ctx, userID, 10, 0)
		if initialNotes == nil {
			initialNotes = []models.Notification{}
		}
		var unreadCount int
		database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false", userID).Scan(&unreadCount)

		initialResponse := gin.H{
			"notifications": initialNotes,
			"total":         total,
			"unread_count":  unreadCount,
		}
		if b, err := json.Marshal(initialResponse); err == nil {
			initialResponseStr = string(b)
			// Cache lại 5 phút
			database.RedisClient.Set(ctx, initCacheKey, initialResponseStr, 5*time.Minute)
		}
	}

	if initialResponseStr != "" {
		c.SSEvent("notifications", initialResponseStr)
		flusher.Flush()
	}

	ch := pubsub.Channel()

	// Keep-alive ticker (prevent timeout)
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.SSEvent("ping", "keep-alive")
			flusher.Flush()
		case msg := <-ch:
			fmt.Printf("[SSE] Received message from Redis: Channel=%s, Payload=%s for User=%s\n", msg.Channel, msg.Payload, userID)
			if msg.Channel == "tasks:global" {
				c.SSEvent("tasks_update", "reload")
			} else if msg.Channel == "notifications:admin" {
				c.SSEvent("support_update", "new_message")
				flusher.Flush()
			} else if msg.Payload == "kick_out" {
				c.SSEvent("account_status", "banned")
				flusher.Flush()
				return // Kick out: Close connection
			} else if msg.Payload == "unbanned" {
				c.SSEvent("account_status", "active")
			} else if msg.Channel == "notifications:global" || msg.Payload == "update" {
				notes, total, err := repository.GetNotificationsByUserID(ctx, userID, 10, 0)
				if notes == nil {
					notes = []models.Notification{}
				}
				if err == nil {
					var unreadCount int
					database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false", userID).Scan(&unreadCount)

					fmt.Printf("[SSE] Pushing updated notifications and unreadCount=%d to User=%s\n", unreadCount, userID)
					
					response := gin.H{
						"notifications": notes,
						"total":         total,
						"unread_count":  unreadCount,
					}
					
					respJSON, _ := json.Marshal(response)
					// Cập nhật cache với version mới nhất
					curVer, _ := database.RedisClient.Get(ctx, "notes:v1:global_version").Result()
					if curVer == "" { curVer = "1" }
					updateKey := fmt.Sprintf("notes:v2:u:%s:p:1:l:10:v:%s", userID, curVer)
					database.RedisClient.Set(ctx, updateKey, string(respJSON), 5*time.Minute)
					c.SSEvent("notifications", string(respJSON))
				} else {
					fmt.Printf("[SSE] Error fetching notes for User=%s: %v\n", userID, err)
				}
			}
			flusher.Flush()
		}
	}
}

func GetNotificationDetail(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")
	ctx := c.Request.Context()

	// Try Redis Cache
	cacheKey := "notes:v1:user:" + userID + ":note:" + id
	val, err := database.RedisClient.Get(ctx, cacheKey).Result()

	if err == nil {
		var note models.Notification
		if json.Unmarshal([]byte(val), &note) == nil {
			c.JSON(http.StatusOK, note)
			return
		}
	}

	// Cache Miss
	note, err := repository.GetNotificationByID(ctx, id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// Save to Redis (TTL 10 mins)
	if noteJSON, err := json.Marshal(note); err == nil {
		database.RedisClient.Set(ctx, cacheKey, noteJSON, 10*time.Minute)
	}

	c.JSON(http.StatusOK, note)
}
