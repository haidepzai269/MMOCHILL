package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/QuangVuDuc006/mmochill-backend/internal/services"
	"github.com/QuangVuDuc006/mmochill-backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func ClaimTask(c *gin.Context) {
	userID := c.GetString("user_id")
	taskID := c.Param("id")

	// 1. Lấy thông tin Task để kiểm tra và lấy Provider
	ctx := c.Request.Context()
	task, err := repository.GetTaskByID(ctx, taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy nhiệm vụ"})
		return
	}

	if !task.IsActive {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nhiệm vụ này hiện đang tạm dừng"})
		return
	}

	// 2. Xác định Nhà cung cấp (Provider)
	provider := task.Provider
	if provider == "" || provider == "manual" {
		provider = "taplayma" // Mặc định nếu chưa set
	}

	// 3. Kiểm tra giới hạn IP TÍNH RIÊNG THEO PROVIDER (Chỉ áp dụng cho taplayma, nhapma và traffic68)
	ip := c.ClientIP()
	if provider == "taplayma" || provider == "nhapma" || provider == "traffic68" {
		today := time.Now().Format("20060102")
		rateLimitKey := fmt.Sprintf("rate_limit:ip:%s:task:%s:%s", ip, taskID, today)
		
		count, _ := database.RedisClient.Get(ctx, rateLimitKey).Int()
		if count >= 3 {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": fmt.Sprintf("Bạn đã vượt quá giới hạn 3 lượt/ngày cho dịch vụ %s trên địa chỉ IP này. Vui lòng thử link của đối tác khác hoặc quay lại vào ngày mai!", provider),
			})
			return
		}
	}

	// 4. Tạo Token và Callback URL
	claimID := fmt.Sprintf("clm_%d", time.Now().UnixNano())
	secret := os.Getenv("BYPASS_SECRET")
	if secret == "" {
		secret = "default_secret_32_chars"
	}
	token := utils.GenerateBypassToken(claimID, userID, secret)
	
	backendURL := os.Getenv("BACKEND_URL")
	callbackURL := fmt.Sprintf("%s/api/v1/callback/bypass?token=%s", backendURL, token)
	
	// CẮT NHÁNH XỬ LÝ URL SHORTENER TÙY THEO NHÀ PROVIDER
	var shortenedUrl string
	
	if provider == "traffic68" {
		// Gọi Module API Traffic68
		sUrl, err := services.GenerateTraffic68Link(callbackURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy link Traffic68: " + err.Error()})
			return
		}
		shortenedUrl = sUrl
	} else {
		// Nhánh cho TapLayMa hoặc NhapMa
		var apiURL string
		if provider == "nhapma" {
			nhapToken := os.Getenv("NHAPMA_TOKEN")
			apiURL = fmt.Sprintf("https://service.nhapma.com/api?token=%s&url=%s", nhapToken, callbackURL)
		} else {
			tapToken := os.Getenv("TAPLAYMA_TOKEN")
			apiURL = fmt.Sprintf("https://api.taplayma.com/api?token=%s&url=%s", tapToken, callbackURL)
		}

		resp, err := http.Get(apiURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi kết nối tới dịch vụ rút gọn link: " + err.Error()})
			return
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		var apiResp struct {
			Status       string `json:"status"`
			ShortenedUrl string `json:"shortenedUrl"`
			Message      string `json:"message"`
		}
		if err := json.Unmarshal(body, &apiResp); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi xử lý phản hồi JSON"})
			return
		}

		if apiResp.Status != "success" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Dịch vụ đối tác trả về lỗi: " + apiResp.Message})
			return
		}
		shortenedUrl = apiResp.ShortenedUrl
	}

	// 5. Lưu bản ghi Claim vào DB
	claim := &models.UserTaskClaim{
		UserID:             userID,
		TaskID:             taskID,
		Status:             models.ClaimPending,
		BypassToken:        token,
		BypassTokenExpires: time.Now().Add(30 * time.Minute),
		BypassURL:          shortenedUrl,
		IPAddress:          ip,
		UserAgent:          c.Request.UserAgent(),
		ClaimedAt:          time.Now(),
	}

	if err := repository.CreateClaim(ctx, claim); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo bản ghi nhiệm vụ: " + err.Error()})
		return
	}

	// 5. Thông báo cho Admin Real-time
	database.RedisClient.Publish(ctx, "admin:claims", "update")

	c.JSON(http.StatusOK, gin.H{
		"claim_id":    claim.ID,
		"bypass_url":  shortenedUrl,
		"token":       token,
		"expires_at":  claim.BypassTokenExpires,
	})
}
