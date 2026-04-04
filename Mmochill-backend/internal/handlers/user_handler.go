package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/QuangVuDuc006/mmochill-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("mmochill-secret-key-2026")
	}
}

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	ctx := c.Request.Context()
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback(ctx)

	user := &models.User{
		Username: req.FullName,
		FullName: req.FullName,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "user",
		Status:   "active",
		// DisplayID sẽ được tự động tạo trong repository dựa trên serial_id
	}

	// Xử lý người giới thiệu nếu có mã code
	if req.ReferredByCode != "" {
		referrer, err := repository.GetUserByReferralCode(req.ReferredByCode)
		if err == nil && referrer != nil {
			user.ReferredBy = &referrer.ID
		}
	}

	if err := repository.CreateUser(user); err != nil {
		log.Printf("DEBUG: Register error for %s: %v", req.Email, err)
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email or Username already exists"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Tự động tạo Ví khi đăng ký
	if err := repository.CreateWallet(ctx, user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wallet"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit registration"})
		return
	}

	tokenPair, err := generateTokens(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		User:         *user,
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
	})
}

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := repository.GetUserByEmail(req.Email)
	if err != nil {
		log.Printf("DEBUG: Login error (user not found) for %s: %v", req.Email, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		log.Printf("DEBUG: Login error (wrong password) for %s", req.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if user.Status == "banned" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ."})
		return
	}

	tokenPair, err := generateTokens(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User:         *user,
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
	})
}

func GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	uid := fmt.Sprintf("%v", userID)
	ctx := c.Request.Context()

	// Check Redis Cache trước (TTL 60 giây - đủ để cache khi navigate giữa các trang)
	cacheKey := "user:profile:" + uid
	if val, err := database.RedisClient.Get(ctx, cacheKey).Result(); err == nil {
		var user models.User
		if json.Unmarshal([]byte(val), &user) == nil {
			c.JSON(http.StatusOK, &user)
			return
		}
	}

	user, err := repository.GetUserByID(uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Lưu vào Redis Cache
	if userJSON, err := json.Marshal(user); err == nil {
		database.RedisClient.Set(ctx, cacheKey, userJSON, 60*time.Second)
	}

	c.JSON(http.StatusOK, user)
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

func generateTokens(userID, role string) (*TokenPair, error) {
	// Access Token (7 days)
	accessClaims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	signedAccess, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return nil, err
	}

	// Refresh Token (7 days)
	refreshClaims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefresh, err := refreshToken.SignedString(jwtSecret)
	if err != nil {
		return nil, err
	}

	// Store Refresh Token in Redis for revocation
	database.RedisClient.Set(database.Ctx, fmt.Sprintf("refresh_token:%s", signedRefresh), userID, 7*24*time.Hour)

	return &TokenPair{
		AccessToken:  signedAccess,
		RefreshToken: signedRefresh,
	}, nil
}

func RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token is required"})
		return
	}

	// 1. Check Redis for existence
	userID, err := database.RedisClient.Get(database.Ctx, fmt.Sprintf("refresh_token:%s", req.RefreshToken)).Result()
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	// 2. Parse and validate
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// 3. Get user details for new token
	user, err := repository.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// 4. Generate new tokens
	// Optional: Rotate refresh token too (issue new refresh token and delete old one)
	database.RedisClient.Del(database.Ctx, fmt.Sprintf("refresh_token:%s", req.RefreshToken))
	tokenPair, err := generateTokens(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	})
}
func UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		FullName  string `json:"full_name"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := repository.UpdateProfile(userID.(string), req.FullName, req.AvatarURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Invalidate profile cache
	database.RedisClient.Del(c.Request.Context(), "user:profile:"+userID.(string))

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	url, err := utils.UploadToCloudinary(file)
	if err != nil {
		log.Printf("Cloudinary error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload to Cloudinary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

func ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email"})
		return
	}

	_, err := repository.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "If the email is registered, a reset link will be sent"})
		return
	}

	b := make([]byte, 20)
	if _, err := rand.Read(b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}
	token := hex.EncodeToString(b)

	if err := repository.SaveResetToken(req.Email, token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save token"})
		return
	}

	resetURL := fmt.Sprintf("%s/reset-password?token=%s", os.Getenv("FRONTEND_URL"), token)
	emailBody := fmt.Sprintf(`
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
			<h2 style="color: #333;">Khôi phục mật khẩu MMOChill</h2>
			<p>Bạn đã yêu cầu khôi phục mật khẩu. Vui lòng nhấp vào nút bên dưới để thiết lập mật khẩu mới (Link có hiệu lực trong 15 phút):</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="%s" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
			</div>
			<p style="color: #777; font-size: 12px;">Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
		</div>
	`, resetURL)

	if err := utils.SendEmail(req.Email, "Reset Your Password - MMOChill", emailBody); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reset link sent successfully"})
}

func ResetPassword(c *gin.Context) {
	var req struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email, err := repository.GetEmailByResetToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	if err := repository.UpdatePassword(email, string(hashedPwd)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func ChangePassword(c *gin.Context) {
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	user, err := repository.GetUserByID(fmt.Sprintf("%v", userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Mật khẩu hiện tại không chính xác"})
		return
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	if err := repository.UpdatePassword(user.Email, string(hashedPwd)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Thay đổi mật khẩu thành công"})
}

func ChangeEmail(c *gin.Context) {
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewEmail        string `json:"new_email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	user, err := repository.GetUserByID(fmt.Sprintf("%v", userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Mật khẩu xác nhận không chính xác"})
		return
	}

	if err := repository.UpdateEmail(fmt.Sprintf("%v", userID), req.NewEmail); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update email"})
		return
	}

	// Invalidate profile cache khi email thay đổi
	database.RedisClient.Del(c.Request.Context(), "user:profile:"+fmt.Sprintf("%v", userID))

	c.JSON(http.StatusOK, gin.H{"message": "Thay đổi Email thành công"})
}

func GetReferralStats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	uid := userID.(string)
	ctx := c.Request.Context()

	// Priority 5: Check Redis Cache (TTL 10 phút)
	cacheKey := "user:referral:" + uid
	if val, err := database.RedisClient.Get(ctx, cacheKey).Result(); err == nil {
		var result map[string]interface{}
		if json.Unmarshal([]byte(val), &result) == nil {
			c.JSON(http.StatusOK, result)
			return
		}
	}

	totalInvited, totalCommission, invitedUsers, err := repository.GetReferralStats(ctx, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get referral stats"})
		return
	}

	// Dùng profile cache (đã có) hoặc query thêm nếu cần referral_code
	user, err := repository.GetUserByID(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Tạo referral link
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	referralLink := fmt.Sprintf("%s/register?ref=%s", frontendURL, user.ReferralCode)

	response := gin.H{
		"referral_code":    user.ReferralCode,
		"referral_link":    referralLink,
		"total_invited":    totalInvited,
		"total_commission": totalCommission,
		"invited_users":    invitedUsers,
	}

	// Lưu vào Redis Cache (10 phút)
	if respJSON, err := json.Marshal(response); err == nil {
		database.RedisClient.Set(ctx, cacheKey, respJSON, 10*time.Minute)
	}

	c.JSON(http.StatusOK, response)
}

func UpdateSoundPreference(c *gin.Context) {
	var req struct {
		Enabled bool `json:"enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := fmt.Sprintf("%v", userID)
	
	if err := repository.UpdateSoundPreference(uid, req.Enabled); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update sound preference"})
		return
	}

	// Invalidate profile cache
	database.RedisClient.Del(c.Request.Context(), "user:profile:"+uid)

	c.JSON(http.StatusOK, gin.H{"message": "Sound preference updated successfully", "enabled": req.Enabled})
}
