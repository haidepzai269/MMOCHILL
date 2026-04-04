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
	_ = godotenv.Load(".env")
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("DATABASE_URL not set in .env, trying default...")
		dbURL = "postgres://postgres:postgres@localhost:5432/mmochill?sslmode=disable"
	}

	fmt.Printf("Connecting to database: %s\n", dbURL)
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal("Unable to connect to database: ", err)
	}
	defer pool.Close()

	// Xóa bỏ unique constraint user_task_claims_user_id_task_id_key
	sql := `ALTER TABLE user_task_claims DROP CONSTRAINT IF EXISTS user_task_claims_user_id_task_id_key`
	
	_, err = pool.Exec(context.Background(), sql)
	if err != nil {
		log.Fatal("Error dropping constraint: ", err)
	}

	fmt.Println("Successfully dropped unique constraint user_task_claims_user_id_task_id_key!")
	fmt.Println("Now users can perform the same task multiple times (up to 3 as limited by logic).")
}
