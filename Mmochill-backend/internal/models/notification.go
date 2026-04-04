package models

import "time"

type Notification struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	Title          string    `json:"title"`
	Message        string    `json:"message"`
	Type           string    `json:"type"`     // severity: info, success, warning, error
	Category       string    `json:"category"` // system, task
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
	GroupID        *string   `json:"group_id"`
	RecipientCount int       `json:"recipient_count,omitempty"`
	RecipientName  string    `json:"recipient_name,omitempty"`
}

type AdminNotificationResponse struct {
	Notifications []Notification `json:"notifications"`
	Total         int            `json:"total"`
}

