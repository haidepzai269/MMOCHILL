package models

import "time"

type TicketStatus string

const (
	StatusOpen     TicketStatus = "open"
	StatusPending  TicketStatus = "pending"
	StatusResolved TicketStatus = "resolved"
	StatusClosed   TicketStatus = "closed"
)

type TicketPriority string

const (
	PriorityLow    TicketPriority = "low"
	PriorityMedium TicketPriority = "medium"
	PriorityHigh   TicketPriority = "high"
)

type SupportTicket struct {
	ID          string         `json:"id"`
	UserID      string         `json:"user_id"`
	UserEmail   string         `json:"user_email"` // Thêm để admin dễ nhận biết
	Subject     string         `json:"subject"`
	Description string         `json:"description"`
	Status      TicketStatus   `json:"status"`
	Priority    TicketPriority `json:"priority"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type SupportMessage struct {
	ID        string    `json:"id"`
	TicketID  string    `json:"ticket_id"`
	SenderID  string    `json:"sender_id"` // UserID hoặc "admin"
	IsAdmin   bool      `json:"is_admin"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
