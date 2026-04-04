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
	pool, _ := pgxpool.New(context.Background(), dbURL)
	defer pool.Close()

	var total int
	pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM user_task_claims").Scan(&total)
	fmt.Printf("Total rows in user_task_claims: %d\n", total)

	// Join tasks to see provider
	query := `
		SELECT c.id, c.user_id, c.task_id, c.status, c.bypass_url, t.provider
		FROM user_task_claims c
		JOIN tasks t ON c.task_id = t.id
		ORDER BY id DESC LIMIT 10`
	rows, err := pool.Query(context.Background(), query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("Recent claims:")
	for rows.Next() {
		var id, uid, tid, status, burl, provider string
		rows.Scan(&id, &uid, &tid, &status, &burl, &provider)
		fmt.Printf("ID: %s, User: %s, Provider: %s, Status: %s, URL: %s\n", id, uid, provider, status, burl)
	}
}
