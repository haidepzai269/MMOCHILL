package models

import (
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

// UserCredential represents the WebAuthn credential stored in the DB
type UserCredential struct {
	ID              []byte    `json:"id" db:"id"`
	UserID          string    `json:"user_id" db:"user_id"`
	PublicKey       []byte    `json:"public_key" db:"public_key"`
	AttestationType string    `json:"attestation_type" db:"attestation_type"`
	AAGUID          []byte    `json:"aaguid" db:"aaguid"`
	SignCount       uint32    `json:"sign_count" db:"sign_count"`
	Transport       []string  `json:"transport" db:"transport"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// Map compatibility with webauthn.Credential
func (c UserCredential) WebAuthnCredential() webauthn.Credential {
	return webauthn.Credential{
		ID:              c.ID,
		PublicKey:       c.PublicKey,
		AttestationType: c.AttestationType,
		Transport:       convertTransport(c.Transport),
		Flags: webauthn.CredentialFlags{
			UserPresent:    true,
			UserVerified:   true,
			BackupEligible: true,
			BackupState:    false,
		},
		Authenticator: webauthn.Authenticator{
			AAGUID:    c.AAGUID,
			SignCount: c.SignCount,
		},
	}
}

func convertTransport(t []string) []protocol.AuthenticatorTransport {
	res := make([]protocol.AuthenticatorTransport, len(t))
	for i, v := range t {
		res[i] = protocol.AuthenticatorTransport(v)
	}
	return res
}
