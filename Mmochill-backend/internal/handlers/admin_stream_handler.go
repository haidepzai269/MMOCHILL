package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func StreamAdmin(c *gin.Context) {
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

	log.Printf("[AdminSSE] New connection established. Token: %s", c.Query("token")[:10]+"...")

	// Subscribe to Admin Topics
	pubsub := database.RedisClient.Subscribe(ctx, "admin:stats", "admin:withdrawals", "admin:users")
	defer func() {
		log.Printf("[AdminSSE] Connection closed for token: %s", c.Query("token")[:10]+"...")
		pubsub.Close()
	}()

	// Initial push: send current stats
	stats, _ := repository.GetAdminStats(ctx)
	if statsJSON, err := json.Marshal(stats); err == nil {
		c.SSEvent("stats", string(statsJSON))
		flusher.Flush()
	}

	ch := pubsub.Channel()

	// Keep-alive ticker
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
			log.Printf("[AdminSSE] Received Redis message: Channel=%s, Payload=%s", msg.Channel, msg.Payload)
			switch msg.Channel {
			case "admin:stats":
				stats, _ := repository.GetAdminStats(ctx)
				if sJSON, err := json.Marshal(stats); err == nil {
					c.SSEvent("stats", string(sJSON))
				}
			case "admin:withdrawals":
				log.Printf("[AdminSSE] Pushing withdrawals_update with payload: %s", msg.Payload)
				c.SSEvent("withdrawals_update", msg.Payload)
			case "admin:users":
				c.SSEvent("users_update", "reload")
			}
			flusher.Flush()
		}
	}
}
