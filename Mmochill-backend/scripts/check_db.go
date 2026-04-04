package main

import (
	"context"
	"fmt"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.ConnectDB()

	ctx := context.Background()
	
	// Check if referral_code exists for current user
	var refCode string
	err := database.Pool.QueryRow(ctx, "SELECT COALESCE(referral_code, '') FROM users WHERE display_id = '26094'").Scan(&refCode)
	if err != nil {
		fmt.Printf("User not found or query error: %v\n", err)
	} else {
		fmt.Printf("User 26094 referral_code: [%s]\n", refCode)
	}

	// Fix ALL users with empty referral_code
	var emptyCount int
	err = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE referral_code IS NULL OR referral_code = ''").Scan(&emptyCount)
	if err == nil && emptyCount > 0 {
		fmt.Printf("Found %d users with empty referral_code. Fixing...\n", emptyCount)
		res, err := database.Pool.Exec(ctx, "UPDATE users SET referral_code = '3112' || serial_id WHERE referral_code IS NULL OR referral_code = ''")
		if err != nil {
			log.Fatalf("Fix failed: %v", err)
		}
		affected, _ := res.RowsAffected()
		fmt.Printf("Fixed %d users.\n", affected)
	} else if err != nil {
		fmt.Printf("Check empty count error: %v\n", err)
	} else {
		fmt.Println("All users have referral_code.")
	}
}
