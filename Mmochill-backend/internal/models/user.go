package models

import (
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
)

type User struct {
	ID             string           `json:"id" db:"id"`
	Username       string           `json:"username" db:"username"`
	FullName       string           `json:"full_name" db:"full_name"`
	DisplayID      string           `json:"display_id" db:"display_id"`
	Email          string           `json:"email" db:"email"`
	Password       string           `json:"-" db:"password_hash"`
	ReferralCode   string           `json:"referral_code" db:"referral_code"`
	ReferredBy     *string          `json:"referred_by,omitempty" db:"referred_by"`
	Balance        float64          `json:"balance" db:"balance"`
	LockedAmount   float64          `json:"locked_amount" db:"locked_amount"`
	PeakBalance    float64          `json:"peak_balance" db:"peak_balance"`
	TotalEarned    float64          `json:"total_earned" db:"total_earned"`
	TotalWithdrawn float64          `json:"total_withdrawn" db:"total_withdrawn"`
	Phone          string           `json:"phone" db:"phone"`
	AvatarURL      string           `json:"avatar_url" db:"avatar_url"`
	Status         string           `json:"status" db:"status"` // active, banned, suspended, pending_verify
	Role           string           `json:"role" db:"role"`     // user, admin
	CreatedAt      time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at" db:"updated_at"`
	CompletedTasksCount int           `json:"completed_tasks_count" db:"completed_tasks_count"`
	SoundEnabled   bool             `json:"sound_enabled" db:"sound_enabled"`
	IsVIP          bool             `json:"is_vip" db:"is_vip"`
	Credentials    []UserCredential `json:"-" db:"-"`
}

// WebAuthnID returns the user's ID as a byte slice
func (u User) WebAuthnID() []byte {
	return []byte(u.ID)
}

// WebAuthnName returns the user's name (email)
func (u User) WebAuthnName() string {
	return u.Email
}

// WebAuthnDisplayName returns the user's display name
func (u User) WebAuthnDisplayName() string {
	if u.FullName != "" {
		return u.FullName
	}
	return u.Username
}

// WebAuthnIcon returns the user's avatar URL
func (u User) WebAuthnIcon() string {
	return u.AvatarURL
}

// WebAuthnCredentials returns the list of WebAuthn credentials
func (u User) WebAuthnCredentials() []webauthn.Credential {
	res := make([]webauthn.Credential, len(u.Credentials))
	for i, c := range u.Credentials {
		res[i] = c.WebAuthnCredential()
	}
	return res
}

type RegisterRequest struct {
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=6"`
	FullName       string `json:"full_name" binding:"required"`
	ReferredByCode string `json:"referred_by_code"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
