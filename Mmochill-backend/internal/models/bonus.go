package models

import "time"

type UserBonus struct {
	UserID        string     `json:"user_id" db:"user_id"`
	LastCheckinAt *time.Time `json:"last_checkin_at" db:"last_checkin_at"`
	CheckinStreak int        `json:"checkin_streak" db:"checkin_streak"`
	LastSpinAt    *time.Time `json:"last_spin_at" db:"last_spin_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

type CheckInStatus struct {
	Streak         int    `json:"streak"`
	CanCheckIn     bool   `json:"can_check_in"`
	CanSpin        bool   `json:"can_spin"`
	NextReward     int64  `json:"next_reward"`
	Days           []bool `json:"days"` // Trạng thái 7 ngày (đã nhận hay chưa)
}

type CheckInResponse struct {
	Reward int64 `json:"reward"`
	Streak int   `json:"streak"`
}

type LuckySpinResponse struct {
	Reward int64  `json:"reward"`
	Label  string `json:"label"`
	Index  int    `json:"index"` // Vị trí trên vòng quay (0-5)
}
