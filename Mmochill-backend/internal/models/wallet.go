package models

import "time"

type Wallet struct {
	ID             string    `json:"id" db:"id"`
	UserID         string    `json:"user_id" db:"user_id"`
	Balance        int64     `json:"balance" db:"balance"`
	LockedAmount   int64     `json:"locked_amount" db:"locked_amount"`
	PeakBalance    int64     `json:"peak_balance" db:"peak_balance"`
	TotalEarned    int64     `json:"total_earned" db:"total_earned"`
	TotalWithdrawn int64     `json:"total_withdrawn" db:"total_withdrawn"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type TransactionType string

const (
	TxTaskReward       TransactionType = "task_reward"
	TxWithdrawalDeduct TransactionType = "withdrawal_deduct"
	TxWithdrawalRefund TransactionType = "withdrawal_refund"
	TxReferralBonus    TransactionType = "referral_bonus"
	TxAdminAdjust      TransactionType = "admin_adjust"
)

type WalletTransaction struct {
	ID            string          `json:"id" db:"id"`
	WalletID      string          `json:"wallet_id" db:"wallet_id"`
	Type          TransactionType `json:"type" db:"type"`
	Amount        int64           `json:"amount" db:"amount"`
	BalanceBefore int64           `json:"balance_before" db:"balance_before"`
	BalanceAfter  int64           `json:"balance_after" db:"balance_after"`
	RefID         *string         `json:"ref_id,omitempty" db:"ref_id"`
	Note          string          `json:"note" db:"note"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
}
