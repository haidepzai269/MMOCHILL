package handlers

import (
	"context"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func getDBTime(ctx context.Context) time.Time {
	var dbTime time.Time
	err := database.Pool.QueryRow(ctx, "SELECT CURRENT_TIMESTAMP").Scan(&dbTime)
	if err != nil {
		log.Printf("[WARNING] getDBTime failed, fallback to server clock: %v", err)
		return time.Now()
	}
	return dbTime
}

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

	location := time.FixedZone("ICT", 7*3600)
	now := getDBTime(ctx).In(location)

	canCheckIn := true
	if ub.LastCheckinAt != nil {
		lastLocal := ub.LastCheckinAt.In(location)
		if lastLocal.Year() == now.Year() && lastLocal.YearDay() == now.YearDay() {
			canCheckIn = false
		}
	}

	canSpin := true
	if ub.LastSpinAt != nil {
		lastLocal := ub.LastSpinAt.In(location)
		if lastLocal.Year() == now.Year() && lastLocal.YearDay() == now.YearDay() {
			canSpin = false
		}
	}

	// Xác định mức thưởng tiếp theo
	streak := ub.CheckinStreak
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

	location := time.FixedZone("ICT", 7*3600)
	now := getDBTime(ctx).In(location)

	if ub.LastCheckinAt != nil {
		lastLocal := ub.LastCheckinAt.In(location)
		if lastLocal.Year() == now.Year() && lastLocal.YearDay() == now.YearDay() {
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

	location := time.FixedZone("ICT", 7*3600)
	now := getDBTime(ctx).In(location)

	if ub.LastSpinAt != nil {
		lastLocal := ub.LastSpinAt.In(location)
		if lastLocal.Year() == now.Year() && lastLocal.YearDay() == now.YearDay() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bạn đã quay thưởng hôm nay rồi"})
			return
		}
	}

	// Tỉ lệ theo yêu cầu:
	// 80: 90%
	// 100: 7%
	// 200: 3%
	// 10,000 VND: 0.000001%
	// 20,000 VND: 0%

	type Prize struct {
		Reward int64
		Label  string
		Weight float64
		Index  int
	}

	prizes := []Prize{
		{100, "100 VND", 7.0, 0},
		{80, "80 VND", 89.999999, 1}, // Tỷ lệ xấp xỉ 90%
		{200, "200 VND", 3.0, 2},
		{10000, "10,000 VND", 0.000001, 3},
		{20000, "20,000 VND", 0.0, 4},
		{0, "Chúc may mắn", 0.0, 5},
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
	// Fallback
	if selected.Label == "" {
		selected = prizes[1] // Mặc định 80 VND
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
