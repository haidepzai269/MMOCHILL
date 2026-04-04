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
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dbURL := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	migrationSQL := `
	DO $$ 
	BEGIN 
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='type') THEN
			ALTER TABLE tasks ADD COLUMN type VARCHAR(50) DEFAULT 'surf';
		END IF;
	END $$;
	`

	_, err = pool.Exec(context.Background(), migrationSQL)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	fmt.Println("Migration applied successfully: column 'type' added to 'tasks' table.")
}
