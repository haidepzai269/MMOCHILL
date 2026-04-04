package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v4/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/mmochill?sslmode=disable"
	}

	pool, err := pgxpool.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	_, err = pool.Exec(context.Background(), "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;")
	if err != nil {
		log.Printf("Migration Error: %v", err)
	} else {
		log.Println("Migration successful: Added is_vip column to users table.")
	}
}
