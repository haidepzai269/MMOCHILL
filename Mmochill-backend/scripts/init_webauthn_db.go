package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(context.Background())

	// 1. Create user_credentials table
	_, err = conn.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS user_credentials (
			id BYTEA PRIMARY KEY,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			public_key BYTEA NOT NULL,
			attestation_type TEXT NOT NULL,
			aaguid BYTEA NOT NULL,
			sign_count BIGINT NOT NULL,
			transport TEXT[] DEFAULT '{}',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create user_credentials table: %v", err)
	}
	fmt.Println("Table user_credentials ensured.")

	// 2. Ensure admin user exists and has admin role
	adminEmail := "haidepzai2692006@gmail.com"
	adminPwd := "123456"
	hashedPwd, _ := bcrypt.GenerateFromPassword([]byte(adminPwd), bcrypt.DefaultCost)

	var userID string
	err = conn.QueryRow(context.Background(), "SELECT id FROM users WHERE email = $1", adminEmail).Scan(&userID)
	if err == pgx.ErrNoRows {
		// Create admin
		err = conn.QueryRow(context.Background(), `
			INSERT INTO users (email, username, password_hash, full_name, role, status, display_id, referral_code, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
			RETURNING id
		`, adminEmail, "admin_dev", string(hashedPwd), "Admin MMOChill", "admin", "active", "ADMIN001", "31121").Scan(&userID)
		if err != nil {
			log.Fatalf("Failed to create admin user: %v", err)
		}
		fmt.Printf("Admin user created with ID: %s\n", userID)
	} else if err != nil {
		log.Fatalf("Failed to query user: %v", err)
	} else {
		// Update existing user to admin
		_, err = conn.Exec(context.Background(), "UPDATE users SET role = 'admin' WHERE id = $1", userID)
		if err != nil {
			log.Fatalf("Failed to update user to admin: %v", err)
		}
		fmt.Println("Existing user promoted to Admin.")
	}
}
