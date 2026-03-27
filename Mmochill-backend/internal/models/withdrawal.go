package models

import "time"

type WithdrawalMethod string

const (
	MethodBank   WithdrawalMethod = "bank"
	MethodMomo   WithdrawalMethod = "momo"
	MethodCrypto WithdrawalMethod = "crypto"
)

type WithdrawalStatus string

const (
	WithdrawalPending    WithdrawalStatus = "pending"
	WithdrawalProcessing WithdrawalStatus = "processing"
	WithdrawalApproved   WithdrawalStatus = "approved"
	WithdrawalRejected   WithdrawalStatus = "rejected"
	WithdrawalDisbursed  WithdrawalStatus = "disbursed"
)

type Withdrawal struct {
	ID            string           `json:"id" db:"id"`
	UserID        string           `json:"user_id" db:"user_id"`
	Amount        int64            `json:"amount" db:"amount"`
	Fee           int64            `json:"fee" db:"fee"`
	NetAmount     int64            `json:"net_amount" db:"net_amount"`
	Method        WithdrawalMethod `json:"method" db:"method"`
	BankName      string           `json:"bank_name,omitempty" db:"bank_name"`
	AccountNumber string           `json:"account_number,omitempty" db:"account_number"`
	AccountName   string           `json:"account_name,omitempty" db:"account_name"`
	PhoneNumber   string           `json:"phone_number,omitempty" db:"phone_number"`
	WalletAddress string           `json:"wallet_address,omitempty" db:"wallet_address"`
	Status        WithdrawalStatus `json:"status" db:"status"`
	AdminNote     string           `json:"admin_note,omitempty" db:"admin_note"`
	ReviewedBy    *string          `json:"reviewed_by,omitempty" db:"reviewed_by"`
	ReviewedAt    *time.Time       `json:"reviewed_at,omitempty" db:"reviewed_at"`
	DisbursedAt   *time.Time       `json:"disbursed_at,omitempty" db:"disbursed_at"`
	CreatedAt     time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at" db:"updated_at"`
}
