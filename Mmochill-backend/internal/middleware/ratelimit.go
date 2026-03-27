package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimit implements sliding window counter using Redis
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Dùng IP hoặc User ID làm key
		key := fmt.Sprintf("ratelimit:%s:%s", c.FullPath(), c.ClientIP())
		
		now := time.Now().UnixMilli()
		windowStart := now - window.Milliseconds()
		
		pipe := database.RedisClient.Pipeline()
		
		// Xóa các request cũ ngoài window
		pipe.ZRemRangeByScore(database.Ctx, key, "0", strconv.FormatInt(windowStart, 10))
		// Đếm số lượng request hiện tại
		pipe.ZCard(database.Ctx, key)
		// Thêm request hiện tại
		pipe.ZAdd(database.Ctx, key, redis.Z{Score: float64(now), Member: now})
		// Đặt expiry cho key
		pipe.Expire(database.Ctx, key, window)
		
		results, err := pipe.Exec(database.Ctx)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Rate limit error"})
			return
		}
		
		count := results[1].(*redis.IntCmd).Val()
		
		if count > int64(limit) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
			})
			return
		}
		
		c.Next()
	}
}
