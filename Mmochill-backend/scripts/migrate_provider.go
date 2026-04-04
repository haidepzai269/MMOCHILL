package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	err := godotenv.Overload(".env")
	if err != nil {
		log.Println("Could not load .env file")
	}
	
	dbURL := os.Getenv("DATABASE_URL")
	fmt.Println("DB URL: ", dbURL)

	database.ConnectDB()

	// Update tasks
	res, err := database.Pool.Exec(context.Background(), "UPDATE tasks SET provider = 'traffic68' WHERE provider = 'anonlink'")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Updated %d tasks to traffic68\n", res.RowsAffected())
}
