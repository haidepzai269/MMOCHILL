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

	rows, _ := pool.Query(context.Background(), "SELECT bypass_token FROM user_task_claims ORDER BY claimed_at DESC LIMIT 5")
	defer rows.Close()

	fmt.Println("Recent Tokens in DB:")
	for rows.Next() {
		var token string
		rows.Scan(&token)
		fmt.Println(token)
	}
}
