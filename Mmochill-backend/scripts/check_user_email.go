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
	
	var email string
	pool.QueryRow(context.Background(), "SELECT email FROM users WHERE id = $1", userID).Scan(&email)
	fmt.Printf("User %s email: %s\n", userID, email)
}
