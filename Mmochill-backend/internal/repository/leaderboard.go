package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

const LeaderboardCacheKey = "leaderboard_top_100"

func GetLeaderboardData(ctx context.Context) ([]models.LeaderboardEntry, error) {
	// 1. Try to get from Redis first
	val, err := database.RedisClient.Get(ctx, LeaderboardCacheKey).Result()
	if err == nil {
		var entries []models.LeaderboardEntry
		if err := json.Unmarshal([]byte(val), &entries); err == nil {
			return entries, nil
		}
	}

	// 2. Query from Database
	query := `
		SELECT 
			u.id, u.username, u.email, COALESCE(u.avatar_url, ''), w.balance,
			COUNT(c.id) as tasks_completed
		FROM users u
		JOIN wallets w ON u.id = w.user_id
		LEFT JOIN user_task_claims c ON u.id = c.user_id AND c.status = 'completed'
		WHERE u.role = 'user' AND u.status = 'active'
		GROUP BY u.id, w.balance
		ORDER BY tasks_completed DESC, w.balance DESC
		LIMIT 100
	`

	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.LeaderboardEntry
	rank := 1
	for rows.Next() {
		var e models.LeaderboardEntry
		err := rows.Scan(
			&e.UserID, &e.Username, &e.Email, &e.AvatarURL, &e.Balance,
			&e.TasksCompleted,
		)
		if err != nil {
			return nil, err
		}
		e.Rank = rank
		e.UpdatedAt = time.Now()
		entries = append(entries, e)
		rank++
	}

	// 3. Cache to Redis for 5 minutes (or update on event)
	if len(entries) > 0 {
		data, _ := json.Marshal(entries)
		database.RedisClient.Set(ctx, LeaderboardCacheKey, data, 5*time.Minute)
	}

	return entries, nil
}

// RefreshLeaderboardCache forces update of the cache
func RefreshLeaderboardCache(ctx context.Context) error {
	_, err := GetLeaderboardData(ctx)
	return err
}
