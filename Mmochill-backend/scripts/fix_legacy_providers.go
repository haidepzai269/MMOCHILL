package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	pool, _ := pgxpool.New(context.Background(), dbURL)
	defer pool.Close()

	_, err := pool.Exec(context.Background(), "UPDATE tasks SET provider = 'taplayma' WHERE provider IS NULL OR provider = 'manual' OR provider = '';")
	if err != nil {
		fmt.Printf("Error updating legacy tasks: %v\n", err)
	} else {
		fmt.Println("Successfully updated legacy tasks to taplayma.")
	}
}
