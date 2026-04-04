package handlers

import (
	"math/rand"
	"net/http"
	"time"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func GetCheckInStatus(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User session not found"})
		return
	}
	
	userID, ok := userIDInterface.(string)
	if !ok {
		log.Printf("[ERROR] user_id in context is not a string: %v", userIDInterface)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user session type"})
		return
	}

	ctx := c.Request.Context()

	ub, err := repository.GetOrCreateUserBonus(ctx, userID)
	if err != nil {
		log.Printf("[ERROR] GetOrCreateUserBonus for %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bonus status: " + err.Error()})
		return
	}

	log.Printf("[DEBUG] User %s: Streak=%d, LastCheckin=%v", userID, ub.CheckinStreak, ub.LastCheckinAt)

	now := time.Now()
	canCheckIn := true
	if ub.LastCheckinAt != nil {
		if ub.LastCheckinAt.Year() == now.Year() && ub.LastCheckinAt.YearDay() == now.YearDay() {
			canCheckIn = false
		}
	}

	canSpin := true
	if ub.LastSpinAt != nil {
		if ub.LastSpinAt.Year() == now.Year() && ub.LastSpinAt.YearDay() == now.YearDay() {
			canSpin = false
		}
	}

	// Xác định mức thưởng tiếp theo
	streak := ub.CheckinStreak
	// Nếu hôm nay đã điểm danh, hoặc chuỗi bị đứt (cần check logic này kỹ hơn ở repo)
	// Để đơn giản cho frontend, ta trả về streak hiện tại.
	
	nextDay := (streak % 7) + 1
	var nextReward int64
	switch nextDay {
	case 1, 2: nextReward = 100
	case 3, 4: nextReward = 150
	case 5, 6: nextReward = 200
	case 7: nextReward = 300
	default: nextReward = 100
	}

	// Trạng thái 7 ngày (đã nhận hay chưa)
	days := make([]bool, 7)
	streakDisplay := streak
	if streakDisplay > 7 {
		streakDisplay = 7
	}
	
	for i := 0; i < streakDisplay; i++ {
		days[i] = true
	}

	c.JSON(http.StatusOK, models.CheckInStatus{
		Streak:     streak,
		CanCheckIn: canCheckIn,
		CanSpin:    canSpin,
		NextReward: nextReward,
		Days:       days,
	})
}

func CheckIn(c *gin.Context) {
	userID, _ := c.Get("user_id")
	ctx := c.Request.Context()

	ub, err := repository.GetOrCreateUserBonus(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bonus status"})
		return
	}

	now := time.Now()
	if ub.LastCheckinAt != nil {
		if ub.LastCheckinAt.Year() == now.Year() && ub.LastCheckinAt.YearDay() == now.YearDay() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bạn đã điểm danh hôm nay rồi"})
			return
		}
	}

	// Tính reward dựa trên streak tiếp theo
	nextDay := (ub.CheckinStreak % 7) + 1
	var reward int64
	switch nextDay {
	case 1, 2: reward = 100
	case 3, 4: reward = 150
	case 5, 6: reward = 200
	case 7: reward = 300
	default: reward = 100
	}

	newStreak, err := repository.PerformCheckIn(ctx, userID.(string), reward)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.CheckInResponse{
		Reward: reward,
		Streak: newStreak,
	})
}

func LuckySpin(c *gin.Context) {
	userID, _ := c.Get("user_id")
	ctx := c.Request.Context()

	ub, err := repository.GetOrCreateUserBonus(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bonus status"})
		return
	}

	now := time.Now()
	if ub.LastSpinAt != nil {
		if ub.LastSpinAt.Year() == now.Year() && ub.LastSpinAt.YearDay() == now.YearDay() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bạn đã quay thưởng hôm nay rồi"})
			return
		}
	}

	// Logic Random có trọng số
	// Tỉ lệ (x 100.000 để xử lý số thực)
	// 80 VND: 60% (60,000)
	// 100 VND: 30% (30,000)
	// 200 VND: 8% (8,000)
	// Chúc may mắn: 1.99899% (1,999)
	// 10,000 VND: 0.001% (1)
	// 20,000 VND: 0.00001% (0.01 -> bỏ qua, lấy 1)
	
	// Để chính xác hơn với yêu cầu:
	// 100, 80, 200, 10000, 20000, May mắn
	
	type Prize struct {
		Reward int64
		Label  string
		Weight float64
		Index  int
	}

	prizes := []Prize{
		{100, "100 VND", 30.0, 0},
		{80, "80 VND", 60.0, 1},
		{200, "200 VND", 8.0, 2},
		{10000, "10,000 VND", 0.001, 3},
		{20000, "20,000 VND", 0.00001, 4},
		{0, "Chúc may mắn lần sau", 1.99899, 5},
	}

	totalWeight := 100.0
	r := rand.New(rand.NewSource(time.Now().UnixNano())).Float64() * totalWeight
	
	var selected Prize
	curr := 0.0
	for _, p := range prizes {
		curr += p.Weight
		if r <= curr {
			selected = p
			break
		}
	}
	// Fallback nếu có sai số float
	if selected.Label == "" {
		selected = prizes[len(prizes)-1]
	}

	err = repository.PerformLuckySpin(ctx, userID.(string), selected.Reward, selected.Label)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.LuckySpinResponse{
		Reward: selected.Reward,
		Label:  selected.Label,
		Index:  selected.Index,
	})
}
