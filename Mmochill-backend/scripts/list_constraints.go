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

	query := `
		SELECT conname
		FROM pg_constraint
		WHERE conrelid = 'user_task_claims'::regclass;`
	
	rows, err := pool.Query(context.Background(), query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("Constraints on user_task_claims:")
	for rows.Next() {
		var name string
		rows.Scan(&name)
		fmt.Printf("- %s\n", name)
	}
}
