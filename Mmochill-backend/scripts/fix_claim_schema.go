package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	queries := []string{
		"ALTER TABLE user_task_claims ALTER COLUMN user_agent TYPE TEXT",
		"ALTER TABLE user_task_claims ALTER COLUMN bypass_token TYPE TEXT",
		"ALTER TABLE user_task_claims ALTER COLUMN bypass_url TYPE TEXT",
	}

	for _, q := range queries {
		fmt.Printf("Executing: %s\n", q)
		_, err := pool.Exec(context.Background(), q)
		if err != nil {
			log.Printf("Error: %v", err)
		} else {
			fmt.Println("Success!")
		}
	}
}
