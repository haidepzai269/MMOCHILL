package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("mmochill-secret-key-2026")
	}
}

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// Cho phép lấy token từ query param (dành cho SSE)
		if tokenString == "" {
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			c.Abort()
			return
		}

		// 1. Kiểm tra Blacklist trên Redis
		// Key format: jwt_blacklist:{token_signature_or_jti}
		// Ở đây đơn giản dùng signature hoặc cả token string tùy thiết kế
		blacklisted, err := database.RedisClient.Exists(database.Ctx, fmt.Sprintf("jwt_blacklist:%s", tokenString)).Result()
		if err == nil && blacklisted > 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token has been invalidated (logged out)"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		uid := claims["user_id"].(string)
		
		// 2. Kiểm tra trạng thái BANNED trên Redis
		// Key format: user:status:{uid}
		status, err := database.RedisClient.Get(c.Request.Context(), fmt.Sprintf("user:status:%s", uid)).Result()
		if err == nil && status == "banned" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.",
				"status": "banned",
			})
			c.Abort()
			return
		}

		c.Set("user_id", uid)
		c.Set("role", claims["role"])
		c.Next()
	}
}
