package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
)

func main() {
	apiToken := "tf68_5383d48eb444dcf9ef5f1a97b8a61e1833401466489dd155"
	targetURL := "https://google.com"
	encodedURL := url.QueryEscape(targetURL)
	
	apiUrl := fmt.Sprintf("https://traffic68.com/api/quicklink/api?api=%s&url=%s", apiToken, encodedURL)
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
