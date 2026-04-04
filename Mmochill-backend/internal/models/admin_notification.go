package models

import (
	"time"
)

type AdminAlert struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`     // info, success, warning, error
	Category  string    `json:"category"` // payment, task
	IsRead    bool      `json:"is_read"`
	Data      interface{} `json:"data"` // Specific related IDs or info
	CreatedAt time.Time `json:"created_at"`
}

type AdminAlertResponse struct {
	Alerts []AdminAlert `json:"alerts"`
	Total  int          `json:"total"`
}
