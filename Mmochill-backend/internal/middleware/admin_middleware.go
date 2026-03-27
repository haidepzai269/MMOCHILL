package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		adminToken := c.GetHeader("X-Admin-Token")
		
		// Cho phép nếu có role admin TRONG JWT HOẶC có mã token admin hợp lệ trong Header
		if (exists && role == "admin") || adminToken == "mmochill-admin-2026" {
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
	}
}
