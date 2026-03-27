package models

import "time"

type ClaimStatus string

const (
	ClaimPending    ClaimStatus = "pending"
	ClaimProcessing ClaimStatus = "processing"
	ClaimCompleted  ClaimStatus = "completed"
	ClaimExpired    ClaimStatus = "expired"
	ClaimFailed     ClaimStatus = "failed"
)

type UserTaskClaim struct {
	ID                 string      `json:"id" db:"id"`
	UserID             string      `json:"user_id" db:"user_id"`
	TaskID             string      `json:"task_id" db:"task_id"`
	Status             ClaimStatus `json:"status" db:"status"`
	BypassToken        string      `json:"bypass_token" db:"bypass_token"`
	BypassTokenExpires time.Time   `json:"bypass_token_expires" db:"bypass_token_expires"`
	BypassURL          string      `json:"bypass_url" db:"bypass_url"`
	ClaimedAt          time.Time   `json:"claimed_at" db:"claimed_at"`
	StartedAt          *time.Time  `json:"started_at,omitempty" db:"started_at"`
	CompletedAt        *time.Time  `json:"completed_at,omitempty" db:"completed_at"`
	IPAddress          string      `json:"ip_address" db:"ip_address"`
	UserAgent          string      `json:"user_agent" db:"user_agent"`
}
