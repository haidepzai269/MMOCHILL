package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type TelegramNotifier struct {
	BotToken string
	ChatID   string
}

func NewTelegramNotifier() *TelegramNotifier {
	return &TelegramNotifier{
		BotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		ChatID:   os.Getenv("TELEGRAM_ADMIN_CHAT_ID"),
	}
}

func (t *TelegramNotifier) SendMessage(message string) error {
	if t.BotToken == "" || t.ChatID == "" {
		return fmt.Errorf("telegram configuration missing")
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.BotToken)
	payload := map[string]string{
		"chat_id":    t.ChatID,
		"text":       message,
		"parse_mode": "Markdown",
	}

	jsonPayload, _ := json.Marshal(payload)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned status: %d", resp.StatusCode)
	}

	return nil
}

func (t *TelegramNotifier) SendWithdrawalAlert(username, amount, method, id string) error {
	msg := fmt.Sprintf(
		"🔔 *Yêu cầu rút tiền mới*\n"+
			"👤 User: %s\n"+
			"💰 Số tiền: %s\n"+
			"🏦 Phương thức: %s\n"+
			"[Duyệt ngay](https://admin.mmochill.com/withdrawals/%s)",
		username, amount, method, id,
	)
	return t.SendMessage(msg)
}
