package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load("c:/Users/admin/OneDrive/Documents/Desktop/MMOChill/Mmochill-backend/.env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is empty")
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	migrationDir := "c:/Users/admin/OneDrive/Documents/Desktop/MMOChill/Mmochill-backend/migrations"
	files, err := os.ReadDir(migrationDir)
	if err != nil {
		log.Fatalf("Error reading migrations dir: %v", err)
	}

	var sqlFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".sql") {
			sqlFiles = append(sqlFiles, f.Name())
		}
	}
	sort.Strings(sqlFiles)

	fmt.Println("Starting migrations on new database...")
	for _, f := range sqlFiles {
		fmt.Printf("Executing %s...\n", f)
		content, err := os.ReadFile(filepath.Join(migrationDir, f))
		if err != nil {
			log.Fatalf("Error reading file %s: %v", f, err)
		}

		_, err = conn.Exec(ctx, string(content))
		if err != nil {
			log.Fatalf("Error executing %s: %v", f, err)
		}
	}

	fmt.Println("Migrations completed successfully!")
}
