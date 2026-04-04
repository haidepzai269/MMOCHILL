package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load("c:/Users/admin/OneDrive/Documents/Desktop/MMOChill/Mmochill-backend/.env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	dbURL := os.Getenv("DATABASE_URL")
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	fmt.Println("Setting up users...")

	// Password hash mặc định cho login là '123456'
	defaultHash := "$2a$10$m6pI1rV.Z/8xU1vX9XqOYeQ0pYlVnL.3yE5u/R6O4U5vQZ0K8v8R."

	setupUser := func(email, role string, balance int64) {
		var userID string
		username := strings.Split(email, "@")[0]
		referralCode := strings.ToUpper(username)
		if len(referralCode) > 16 {
			referralCode = referralCode[:16]
		}

		// Insert user
		query := `
			INSERT INTO users (email, username, password_hash, role, referral_code) 
			VALUES ($1, $2, $3, $4, $5) 
			ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role 
			RETURNING id
		`
		err := conn.QueryRow(ctx, query, email, username, defaultHash, role, referralCode).Scan(&userID)
		if err != nil {
			log.Fatalf("Failed to setup user %s: %v", email, err)
		}

		// Insert wallet
		_, err = conn.Exec(ctx, `
			INSERT INTO wallets (user_id, balance) 
			VALUES ($1, $2) 
			ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance
		`, userID, balance)
		
		if err != nil {
			log.Fatalf("Failed to setup wallet for %s: %v", email, err)
		}
		fmt.Printf("User %s setup complete (Role: %s, Balance: %d)\n", email, role, balance)
	}

	setupUser("haidepzai2692006@gmail.com", "admin", 0)
	setupUser("haidepzai92006@gmail.com", "user", 1000000000000)

	fmt.Println("All done! You can now login with these emails. Default password: '123456'")
}
