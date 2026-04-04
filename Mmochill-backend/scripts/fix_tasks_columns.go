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
	godotenv.Load(".env")
	dbURL := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	// Thêm cột type và status vào bảng tasks
	queries := []string{
		"ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'surf'",
		"ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'",
	}

	for _, q := range queries {
		_, err := pool.Exec(context.Background(), q)
		if err != nil {
			log.Printf("Error executing %s: %v", q, err)
		} else {
			fmt.Printf("Successfully executed: %s\n", q)
		}
	}

	fmt.Println("Database update for tasks table completed!")
}
