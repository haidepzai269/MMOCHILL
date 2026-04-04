package main

import (
	"context"
	"fmt"
	"os"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	database.ConnectDB()

	userID := "019dbe50-5755-466d-8951-4076e0242271" 
	
	tasks, err := repository.GetAvailableTasksForUser(context.Background(), userID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR calling GetAvailableTasksForUser: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Success! Fetched %d tasks\n", len(tasks))
}
