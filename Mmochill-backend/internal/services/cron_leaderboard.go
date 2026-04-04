package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
)

func StartLeaderboardCron(ctx context.Context) {
	// 1. Calculate time until next month start
	now := time.Now()
	next := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
	diff := next.Sub(now)

	log.Printf("Leaderboard Cron: Next reward in %v", diff)

	ticker := time.NewTicker(diff)
	defer ticker.Stop()

	// 2. Loop and check monthly
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Reward Top 3
			rewardTopThree(ctx)

			// Reset ticker for next month
			now = time.Now()
			next = time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
			ticker.Reset(next.Sub(now))
		}
	}
}

func rewardTopThree(ctx context.Context) {
	log.Println("Leaderboard Cron: Processing monthly rewards...")

	// 1. Get Top 3
	entries, err := repository.GetLeaderboardData(ctx)
	if err != nil || len(entries) < 1 {
		log.Printf("Leaderboard Cron: Failed to get leaderboard entries: %v", err)
		return
	}

	for i := 0; i < 3 && i < len(entries); i++ {
		user := entries[i]
		var percentage float64
		switch i {
		case 0: // Top 1
			percentage = 0.10
		case 1: // Top 2
			percentage = 0.08
		case 2: // Top 3
			percentage = 0.05
		}

		rewardAmount := int64(float64(user.Balance) * percentage)
		if rewardAmount <= 0 {
			continue
		}

		// 2. Update wallet and create transaction in a single step using AddWalletBalance
		note := fmt.Sprintf("Thưởng Top %d Leaderboard tháng %s", i+1, time.Now().AddDate(0, -1, 0).Format("01/2006"))
		err := repository.AddWalletBalance(ctx, nil, user.UserID, rewardAmount, models.TxLeaderboardReward, "", note)
		if err != nil {
			log.Printf("Leaderboard Cron: Failed to reward user %s (Top %d): %v", user.Username, i+1, err)
			continue
		}

		// 3. Send Notification
		// We'll need a notification repo for this
		createLeaderboardNotification(ctx, user.UserID, i+1, rewardAmount)
		
		log.Printf("Leaderboard Cron: Rewarded user %s (Top %d) with %d", user.Username, i+1, rewardAmount)
	}
}

func createLeaderboardNotification(ctx context.Context, userID string, rank int, amount int64) {
	query := `
		INSERT INTO notifications (user_id, title, message, type, category)
		VALUES ($1, $2, $3, 'success', 'system')
	`
	title := "Chúc mừng! Bạn đã nhận thưởng đua Top"
	message := fmt.Sprintf("Chúc mừng bạn đã đạt Top %d Leaderboard tháng qua! Bạn nhận được %d VNĐ (thưởng từ số dư hiện có). Tiếp tục cố gắng nhé!", rank, amount)
	
	_, err := database.Pool.Exec(ctx, query, userID, title, message)
	if err != nil {
		log.Printf("Failed to send notification for leaderboard reward: %v", err)
	}
}
