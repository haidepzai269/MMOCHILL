package models

import "time"

type LeaderboardEntry struct {
	UserID         string    `json:"user_id"`
	Username       string    `json:"username"`
	Email          string    `json:"email"` // Will be masked in handler
	Balance        int64     `json:"balance"`
	TasksCompleted int       `json:"tasks_completed"`
	Rank           int       `json:"rank"`
	AvatarURL      string    `json:"avatar_url"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type LeaderboardResponse struct {
	TopUsers []LeaderboardEntry `json:"top_users"`
	LastUpdate int64            `json:"last_update"` // Unix timestamp
}
