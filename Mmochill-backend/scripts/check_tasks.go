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

	rows, err := pool.Query(context.Background(), "SELECT id, title, type, status FROM tasks LIMIT 5")
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	fmt.Println("Tasks in database:")
	for rows.Next() {
		var id, title, ttype, status string
		err := rows.Scan(&id, &title, &ttype, &status)
		if err != nil {
			log.Printf("Scan error: %v", err)
			continue
		}
		fmt.Printf("- [%s] %s (Type: %s, Status: %s)\n", id, title, ttype, status)
	}
}
