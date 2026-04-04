package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
)

type Traffic68Response struct {
	Status       string `json:"status"`
	ShortenedUrl string `json:"shortenedUrl"`
	Message      string `json:"message"`
}

func GenerateTraffic68Link(targetURL string) (string, error) {
	apiToken := os.Getenv("TRAFFIC68_TOKEN")
	if apiToken == "" {
		return "", fmt.Errorf("TRAFFIC68_TOKEN chưa được cấu hình trong máy chủ")
	}

	encodedURL := url.QueryEscape(targetURL)
	apiUrl := fmt.Sprintf("https://traffic68.com/api/quicklink/api?api=%s&url=%s", apiToken, encodedURL)

	resp, err := http.Get(apiUrl)
	if err != nil {
		return "", fmt.Errorf("lỗi kết nối hệ thống Traffic68: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("lỗi đọc response: %v", err)
	}

	var parsedResp Traffic68Response
	if err := json.Unmarshal(body, &parsedResp); err != nil {
		return "", fmt.Errorf("lỗi parse JSON từ Traffic68 API. Body: %s", body)
	}

	if parsedResp.Status == "error" {
		return "", fmt.Errorf("traffic68 báo lỗi: %s", parsedResp.Message)
	}

	if parsedResp.ShortenedUrl == "" {
		return "", fmt.Errorf("không tìm thấy shortenedUrl trong Traffic68 response")
	}

	return parsedResp.ShortenedUrl, nil
}
