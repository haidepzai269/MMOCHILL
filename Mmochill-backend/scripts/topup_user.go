package main

import (
	"context"
	"fmt"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env from parent directory
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	database.ConnectDB()
	
	email := "haidepzai92006@gmail.com"
	amount := 100000000000

	ctx := context.Background()
	var userID string
	err = database.Pool.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", email).Scan(&userID)
	if err != nil {
		fmt.Printf("User %s not found, trying haidepzai2692006@gmail.com...\n", email)
		email = "haidepzai2692006@gmail.com"
		err = database.Pool.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", email).Scan(&userID)
		if err != nil {
			log.Fatalf("No user found with either email: %v", err)
		}
	}

	// Upsert wallet
	query := `
		INSERT INTO wallets (user_id, balance, peak_balance, updated_at)
		VALUES ($1, $2, $2, NOW())
		ON CONFLICT (user_id) DO UPDATE 
		SET balance = wallets.balance + EXCLUDED.balance,
		    peak_balance = GREATEST(wallets.peak_balance, wallets.balance + EXCLUDED.balance),
		    updated_at = NOW()
	`
	
	_, err = database.Pool.Exec(ctx, query, userID, amount)
	if err != nil {
		log.Fatalf("Failed to update wallet: %v", err)
	}

	fmt.Printf("Successfully added %d VND to %s\n", amount, email)
}
