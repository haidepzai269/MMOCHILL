package main

import (
	"context"
	"fmt"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}
	database.ConnectDB()
	
	email := "haidepzai92006@gmail.com"
	role := "admin"
	
	query := "UPDATE users SET role = $1 WHERE email = $2"
	
	tag, err := database.Pool.Exec(context.Background(), query, role, email)
	if err != nil {
		log.Fatalf("Update failed: %v", err)
	}

	if tag.RowsAffected() == 0 {
		fmt.Printf("User %s not found, trying haidepzai2692006@gmail.com...\n", email)
		email = "haidepzai2692006@gmail.com"
		tag, err = database.Pool.Exec(context.Background(), query, role, email)
		if err != nil {
			log.Fatalf("Update failed: %v", err)
		}
	}

	fmt.Printf("Successfully updated role to %s for %s. Rows affected: %d\n", role, email, tag.RowsAffected())
}
