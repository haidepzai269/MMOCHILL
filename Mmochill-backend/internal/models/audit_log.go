package models

import "time"

type AuditLog struct {
	ID        string    `json:"id" db:"id"`
	AdminID   string    `json:"admin_id" db:"admin_id"`
	Action    string    `json:"action" db:"action"`
	TargetID  string    `json:"target_id" db:"target_id"`
	Details   string    `json:"details" db:"details"`
	IPAddress string    `json:"ip_address" db:"ip_address"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
