package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func RequestWithdrawal(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		Amount        int64                   `json:"amount" binding:"required,min=10000"`
		Method        models.WithdrawalMethod `json:"method" binding:"required"`
		BankName      string                  `json:"bank_name"`
		AccountNumber string                  `json:"account_number"`
		AccountName   string                  `json:"account_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback(ctx)

	// 1. Lock balance
	if err := repository.LockBalanceForWithdrawal(ctx, tx, userID, req.Amount); err != nil {
		log.Printf("ERROR: LockBalanceForWithdrawal failed for user %s, amount %d: %v", userID, req.Amount, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance or concurrent request"})
		return
	}

	// 2. Create withdrawal record
	withdrawal := &models.Withdrawal{
		UserID:        userID,
		Amount:        req.Amount,
		NetAmount:     req.Amount, // Tạm thời chưa tính phí
		Method:        req.Method,
		BankName:      req.BankName,
		AccountNumber: req.AccountNumber,
		AccountName:   req.AccountName,
		Status:        models.WithdrawalPending,
	}
	if err := repository.CreateWithdrawal(ctx, tx, withdrawal); err != nil {
		log.Printf("ERROR: CreateWithdrawal failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create withdrawal request: " + err.Error()})
		return
	}

	// Tạo thông báo cho user
	_ = repository.CreateNotification(ctx, tx, userID, "Yêu cầu rút tiền", "Yêu cầu rút "+fmt.Sprintf("%d", req.Amount)+" VND của bạn đã được gửi và đang chờ duyệt.", "info", "system")

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit"})
		return
	}

	// Invalidate Notification Cache
	database.RedisClient.Del(ctx, "notes:v1:user:"+userID)

	// Notify SSE
	log.Printf("[Withdrawal] Publishing update for user: %s", userID)
	database.RedisClient.Publish(ctx, "notifications:user:"+userID, "update")

	errAdmin := database.RedisClient.Publish(ctx, "admin:withdrawals", "new").Err()
	if errAdmin != nil {
		log.Printf("[Withdrawal] ERROR publishing to admin:withdrawals: %v", errAdmin)
	} else {
		log.Printf("[Withdrawal] Successfully published to admin:withdrawals")
	}

	database.RedisClient.Publish(ctx, "admin:stats", "update")

	c.JSON(http.StatusOK, gin.H{"message": "Withdrawal request submitted", "id": withdrawal.ID})
}
