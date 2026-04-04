package main

import (
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	apiToken := os.Getenv("ANONLINK_TOKEN")
	targetURL := "https://google.com"
	
	apiUrl := fmt.Sprintf("https://anonlink.io/api?api=%s&url=%s", apiToken, targetURL)
	fmt.Printf("Calling: %s\n", apiUrl)
	
	resp, err := http.Get(apiUrl)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("RAW RESPONSE: %s\n", string(body))
}
