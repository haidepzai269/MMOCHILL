package models

import "time"

type TaskStatus string

const (
	TaskStatusActive   TaskStatus = "active"
	TaskStatusInactive TaskStatus = "inactive"
)

type TaskType string

const (
	TaskTypeSurf  TaskType = "surf"
	TaskTypeApp   TaskType = "app"
	TaskTypeVideo TaskType = "video"
)

type Task struct {
	ID               string     `json:"id" db:"id"`
	Title            string     `json:"title" db:"title"`
	Description      string     `json:"description" db:"description"`
	Reward           int64      `json:"reward" db:"reward"` // BIGINT
	Provider         string     `json:"provider" db:"provider"`
	OriginalURL      string     `json:"original_url" db:"original_url"`
	MinTimeSeconds   int        `json:"min_time_seconds" db:"min_time_seconds"`
	MaxCompletions   int        `json:"max_completions" db:"max_completions"`
	TotalCompleted   int        `json:"total_completed" db:"total_completed"`
	IsActive         bool       `json:"is_active" db:"is_active"`
	Type             TaskType   `json:"type" db:"type"`
	Status           TaskStatus `json:"status" db:"status"` // Tương thích với frontend cũ nếu cần
	ExpiresAt        *time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
	CompletionsToday    int        `json:"completions_today" db:"-"`
	MaxCompletionsToday int        `json:"max_completions_today" db:"-"`
}
