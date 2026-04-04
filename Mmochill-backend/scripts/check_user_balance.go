package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	pool, _ := pgxpool.New(context.Background(), dbURL)
	defer pool.Close()

	userID := "738cf3ff-0f0e-4be1-9868-79912ad19c10"
	
	var balance int64
	row := pool.QueryRow(context.Background(), "SELECT balance FROM wallets WHERE user_id = $1", userID)
	if err := row.Scan(&balance); err != nil {
		fmt.Printf("Error finding wallet: %v\n", err)
	} else {
		fmt.Printf("Wallet Balance for User %s: %d VND\n", userID, balance)
	}

	rows, _ := pool.Query(context.Background(), "SELECT amount, note, created_at FROM wallet_transactions WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = $1) ORDER BY created_at DESC LIMIT 5", userID)
	defer rows.Close()

	fmt.Println("Recent transactions:")
	for rows.Next() {
		var amount int64
		var note string
		var created_at interface{}
		rows.Scan(&amount, &note, &created_at)
		fmt.Printf("Amount: %d, Note: %s, Time: %v\n", amount, note, created_at)
	}
}
