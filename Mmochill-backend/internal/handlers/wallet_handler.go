package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

// GetMyTransactions lấy lịch sử giao dịch của user đang đăng nhập
func GetMyTransactions(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limitStr := c.DefaultQuery("limit", "100") // Lấy 100 giao dịch gần nhất mặc định để đủ vẽ biểu đồ
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	wallet, err := repository.GetWalletByUserID(c.Request.Context(), userID.(string))
	if err != nil || wallet == nil {
		// User chưa có ví hoặc lỗi thì trả về mảng rỗng
		c.JSON(http.StatusOK, gin.H{
			"transactions": []interface{}{},
			"total":        0,
		})
		return
	}

	transactions, err := repository.GetTransactionsByWalletID(c.Request.Context(), wallet.ID, limit, offset)
	if err != nil {
		log.Printf("GetTransactionsByWalletID err: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy lịch sử giao dịch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"wallet":       wallet,
	})
}

// GetAdminUserTransactions cho phép admin xem lịch sử dòng tiền của một user bất kỳ
func GetAdminUserTransactions(c *gin.Context) {
	paramUserID := c.Param("id")
	if paramUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thiếu user ID"})
		return
	}

	limitStr := c.DefaultQuery("limit", "100")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Lôi ví của user đó ra
	wallet, err := repository.GetWalletByUserID(c.Request.Context(), paramUserID)
	if err != nil || wallet == nil {
		c.JSON(http.StatusOK, gin.H{
			"transactions": []interface{}{},
			"total":        0,
		})
		return
	}

	transactions, err := repository.GetTransactionsByWalletID(c.Request.Context(), wallet.ID, limit, offset)
	if err != nil {
		log.Printf("Admin GetTransactionsByWalletID err: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy vấn lịch sử"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"wallet":       wallet,
	})
}
