package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.ConnectDB()

	path := filepath.Join("migrations", "012_add_bonus_system.sql")
	content, err := ioutil.ReadFile(path)
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	_, err = database.Pool.Exec(context.Background(), string(content))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("Migration 012 applied successfully!")
}
