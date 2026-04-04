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

	query := `
		SELECT column_name, data_type, character_maximum_length
		FROM information_schema.columns
		WHERE table_name = 'user_task_claims'
	`

	rows, err := pool.Query(context.Background(), query)
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	fmt.Println("Columns in user_task_claims:")
	for rows.Next() {
		var name, dtype string
		var length *int
		if err := rows.Scan(&name, &dtype, &length); err != nil {
			log.Fatal(err)
		}
		lenStr := "null"
		if length != nil {
			lenStr = fmt.Sprintf("%d", *length)
		}
		fmt.Printf("- %s: %s (%s)\n", name, dtype, lenStr)
	}
}
