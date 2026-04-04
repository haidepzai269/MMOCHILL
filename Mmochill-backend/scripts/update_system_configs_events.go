package main

import (
	"context"
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
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	query := `
	ALTER TABLE system_configs 
	ADD COLUMN IF NOT EXISTS active_event TEXT DEFAULT 'none',
	ADD COLUMN IF NOT EXISTS event_mode TEXT DEFAULT 'manual';
	`

	_, err = pool.Exec(context.Background(), query)
	if err != nil {
		log.Fatalf("Failed to alter table: %v", err)
	}

	log.Println("Table system_configs updated with active_event and event_mode columns.")
}
