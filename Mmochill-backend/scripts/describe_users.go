package main

import (
	"context"
	"fmt"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	database.ConnectDB()
	
	email := "haidepzai92006@gmail.com"
	var role string
	var balance, peakBalance int64
	
	query := `
		SELECT u.role, w.balance, w.peak_balance 
		FROM users u 
		LEFT JOIN wallets w ON u.id = w.user_id 
		WHERE u.email = $1
	`
	
	err = database.Pool.QueryRow(context.Background(), query, email).Scan(&role, &balance, &peakBalance)
	if err != nil {
		fmt.Printf("User %s not found, checking haidepzai2692006@gmail.com...\n", email)
		email = "haidepzai2692006@gmail.com"
		err = database.Pool.QueryRow(context.Background(), query, email).Scan(&role, &balance, &peakBalance)
		if err != nil {
			log.Fatalf("No user found with either email: %v", err)
		}
	}

	fmt.Printf("User: %s\nRole: %s\nBalance: %d\nPeak Balance: %d\n", email, role, balance, peakBalance)
}
