package utils

import (
	"log"
	"os"

	"github.com/go-webauthn/webauthn/webauthn"
)

var WebAuthn *webauthn.WebAuthn

func InitWebAuthn() {
	var err error
	wconfig := &webauthn.Config{
		RPDisplayName: "MMOChill Admin Portal",
		RPID:          "localhost",
		RPOrigins:     []string{os.Getenv("FRONTEND_URL")}, // e.g., http://localhost:3000
	}

	WebAuthn, err = webauthn.New(wconfig)
	if err != nil {
		log.Fatal("Failed to create WebAuthn instance:", err)
	}
}
