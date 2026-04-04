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
	CREATE TABLE IF NOT EXISTS system_configs (
		id SERIAL PRIMARY KEY,
		sidebar_bg TEXT DEFAULT '#18181b',
		sidebar_text TEXT DEFAULT '#fafafa',
		page_bg TEXT DEFAULT '#09090b',
		primary_color TEXT DEFAULT '#3b82f6',
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Insert default config if not exists
	INSERT INTO system_configs (id, sidebar_bg, sidebar_text, page_bg, primary_color)
	SELECT 1, '#18181b', '#fafafa', '#09090b', '#3b82f6'
	WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE id = 1);
	`

	_, err = pool.Exec(context.Background(), query)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}

	log.Println("Table system_configs created and default record inserted.")
}
