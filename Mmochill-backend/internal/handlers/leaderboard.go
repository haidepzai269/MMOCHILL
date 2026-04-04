package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

// MaskEmail masks email addresses like hai******@gmail.com
func MaskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return email
	}
	name := parts[0]
	domain := parts[1]
	if len(name) <= 3 {
		return name + "***@" + domain
	}
	return name[:3] + "******@" + domain
}

func GetLeaderboard(c *gin.Context) {
	entries, err := repository.GetLeaderboardData(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	// 1. Mask emails and prepare response
	for i := range entries {
		entries[i].Email = MaskEmail(entries[i].Email)
	}

	c.JSON(200, gin.H{
		"top_users":   entries,
		"last_update": time.Now().Unix(),
	})
}

// StreamLeaderboard handles SSE for real-time leaderboard updates
func StreamLeaderboard(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	// 1. Initial send
	entries, _ := repository.GetLeaderboardData(c.Request.Context())
	for i := range entries {
		entries[i].Email = MaskEmail(entries[i].Email)
	}
	data, _ := json.Marshal(entries)
	fmt.Fprintf(c.Writer, "data: %s\n\n", data)
	c.Writer.Flush()

	// 2. Continuous listening for updates
	ticker := time.NewTicker(30 * time.Second) // Check for changes every 30s
	defer ticker.Stop()

	// Using context from the request to detect disconnection
	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			currentEntries, err := repository.GetLeaderboardData(ctx)
			if err != nil {
				continue
			}
			for i := range currentEntries {
				currentEntries[i].Email = MaskEmail(currentEntries[i].Email)
			}
			newData, _ := json.Marshal(currentEntries)
			_, err = fmt.Fprintf(c.Writer, "data: %s\n\n", newData)
			if err != nil {
				return // Client disconnected
			}
			c.Writer.Flush()
		}
	}
}
