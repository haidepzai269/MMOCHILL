package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/QuangVuDuc006/mmochill-backend/internal/repository"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	database.ConnectDB()
	if database.Pool != nil {
		defer database.Pool.Close()
	}

	ctx := context.Background()
	expiresAt := time.Now().Add(24 * time.Hour)
	task := models.Task{
		Title:          "Test Task " + time.Now().Format("15:04:05"),
		Description:    "Test description",
		Reward:         1000,
		Provider:       "test",
		OriginalURL:    "https://example.com",
		MinTimeSeconds: 10,
		MaxCompletions: 100,
		ExpiresAt:      &expiresAt,
		Type:           models.TaskTypeSurf,
	}

	err := repository.CreateTask(ctx, task)
	if err != nil {
		log.Fatalf("CreateTask failed: %v", err)
	}

	fmt.Println("Successfully created test task!")
	
	tasks, err := repository.GetAllTasks(ctx)
	if err != nil {
		log.Fatalf("GetAllTasks failed: %v", err)
	}
	
	fmt.Printf("Total tasks in DB: %d\n", len(tasks))
	for _, t := range tasks {
		fmt.Printf("- %s: %s (Type: %s)\n", t.ID, t.Title, t.Type)
	}
}
