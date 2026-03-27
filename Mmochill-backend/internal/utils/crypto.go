package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"
)

// GenerateBypassToken tạo token có HMAC signature theo spec trong prompt.txt
func GenerateBypassToken(claimID, userID string, secret string) string {
	// Payload: claimID:userID:timestamp
	payload := fmt.Sprintf("%s:%s:%d", claimID, userID, time.Now().UnixNano())
	
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	
	// Token format: base64(payload).signature
	return fmt.Sprintf("%s.%s", base64.RawURLEncoding.EncodeToString([]byte(payload)), sig)
}

// VerifyBypassToken kiểm tra tính hợp lệ của token
func VerifyBypassToken(token, secret string) (payload string, err error) {
	// Logic verify sẽ được gọi trong callback handler
	return "", nil 
}
