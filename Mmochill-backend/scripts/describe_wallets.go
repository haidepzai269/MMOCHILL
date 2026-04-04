package main

import (
	"context"
	"fmt"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	database.ConnectDB()
	
	query := `
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'wallets'
	`
	
	rows, err := database.Pool.Query(context.Background(), query)
	if err != nil {
		fmt.Println("Table 'wallets' might not exist.")
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	fmt.Println("Columns in 'wallets' table:")
	for rows.Next() {
		var name, dtype string
		if err := rows.Scan(&name, &dtype); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("- %s (%s)\n", name, dtype)
	}
}
