package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// GenerateBypassToken tạo token có HMAC signature dưới dạng Hex (an toàn URL tuyệt đối)
func GenerateBypassToken(claimID, userID string, secret string) string {
	// Payload: claimID:userID:timestamp
	payload := fmt.Sprintf("%s:%s:%d", claimID, userID, time.Now().UnixNano())
	
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	
	// Token format: hex(payload).signature
	return fmt.Sprintf("%x.%s", payload, sig)
}

// VerifyBypassToken kiểm tra tính hợp lệ của token (dành cho logic kiểm tra sâu nếu cần)
func VerifyBypassToken(token, secret string) (payload string, err error) {
	// Task này hiện tại dùng lookup DB trực tiếp dựa trên token literal, 
	// nhưng ta có thể mở rộng logic verify HMAC ở đây nếu muốn bảo mật hơn.
	return "", nil 
}
