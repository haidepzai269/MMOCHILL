package handlers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/QuangVuDuc006/mmochill-backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func ClaimTask(c *gin.Context) {
	userID := c.GetString("user_id")
	taskID := c.Param("id")

	// 1. Kiểm tra task có tồn tại và đang active không (giả định dùng GetTasks hoặc viết hàm GetTaskByID)
	// Để đơn giản, ở đây mình claim trực tiếp, logic kiểm tra sâu hơn sẽ ở service layer nếu có.
	
	claimID := fmt.Sprintf("clm_%d", time.Now().UnixNano())
	secret := os.Getenv("BYPASS_SECRET")
	if secret == "" {
		secret = "default_bypass_secret_key_32_char"
	}

	token := utils.GenerateBypassToken(claimID, userID, secret)
	
	// Spec: callback URL trỏ về API của chúng ta
	callbackURL := fmt.Sprintf("%s/api/v1/callback/bypass?token=%s", os.Getenv("BACKEND_URL"), token)
	
	// Giả lập provider URL (web1s...)
	// Trong thực tế, bạn sẽ gọi API của provider ở đây để lấy link rút gọn
	providerURL := fmt.Sprintf("https://web1s.com/short?url=%s&api_key=%s", callbackURL, os.Getenv("WEB1S_API_KEY"))

	claim := &models.UserTaskClaim{
		UserID:             userID,
		TaskID:             taskID,
		Status:             models.ClaimPending,
		BypassToken:        token,
		BypassTokenExpires: time.Now().Add(20 * time.Minute),
		BypassURL:          providerURL,
		IPAddress:          c.ClientIP(),
		UserAgent:          c.Request.UserAgent(),
	}

	if err := repository.CreateClaim(c.Request.Context(), claim); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create claim: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"claim_id":    claim.ID,
		"bypass_url":  providerURL,
		"token":       token,
		"expires_at":  claim.BypassTokenExpires,
	})
}
