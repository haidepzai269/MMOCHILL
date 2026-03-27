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
)

func GetNotifications(c *gin.Context) {
	userID := c.GetString("user_id")
	ctx := c.Request.Context()

	// Try Redis Cache with Global Versioning
	version, _ := database.RedisClient.Get(ctx, "notes:v1:global_version").Result()
	if version == "" {
		version = "1"
	}
	cacheKey := "notes:v1:user:" + userID + ":" + version
	val, err := database.RedisClient.Get(ctx, cacheKey).Result()

	if err == nil {
		var notes []models.Notification
		if json.Unmarshal([]byte(val), &notes) == nil {
			c.JSON(http.StatusOK, notes)
			return
		}
	}

	// Cache Miss or Parse Error
	notes, err := repository.GetNotificationsByUserID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save to Redis (TTL 5 mins)
	if notesJSON, err := json.Marshal(notes); err == nil {
		database.RedisClient.Set(ctx, cacheKey, notesJSON, 5*time.Minute)
	}

	c.JSON(http.StatusOK, notes)
}

func MarkAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")
	ctx := c.Request.Context()

	if err := repository.MarkNotificationAsRead(ctx, id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate Redis Cache with current version
	version, _ := database.RedisClient.Get(ctx, "notes:v1:global_version").Result()
	if version == "" {
		version = "1"
	}
	database.RedisClient.Del(ctx, "notes:v1:user:"+userID+":"+version)

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

	// Invalidate Redis Cache
	version, _ := database.RedisClient.Get(ctx, "notes:v1:global_version").Result()
	if version == "" {
		version = "1"
	}
	database.RedisClient.Del(ctx, "notes:v1:user:"+userID+":"+version)

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

	// Initial push: send current notifications
	initialNotes, _ := repository.GetNotificationsByUserID(ctx, userID)
	if initialNotesJSON, err := json.Marshal(initialNotes); err == nil {
		c.SSEvent("notifications", string(initialNotesJSON))
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
				notes, err := repository.GetNotificationsByUserID(ctx, userID)
				if err == nil {
					fmt.Printf("[SSE] Pushing %d notifications to User=%s\n", len(notes), userID)
					notesJSON, _ := json.Marshal(notes)
					c.SSEvent("notifications", string(notesJSON))
				} else {
					fmt.Printf("[SSE] Error fetching notes for User=%s: %v\n", userID, err)
				}
			}
			flusher.Flush()
		}
	}
}
