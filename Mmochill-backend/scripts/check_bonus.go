package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		fmt.Printf("Error connecting: %v\n", err)
		return
	}
	defer pool.Close()

	fmt.Printf("Current server time (UTC): %v\n", time.Now().UTC())
	fmt.Printf("Current server time (Local): %v\n", time.Now())
	fmt.Printf("Current server YearDay: %d\n\n", time.Now().YearDay())

	// Kiểm tra tất cả các user_bonuses
	rows, err := pool.Query(context.Background(), `
		SELECT 
			ub.user_id,
			u.username,
			ub.last_checkin_at,
			ub.checkin_streak,
			ub.last_spin_at,
			ub.created_at
		FROM user_bonuses ub
		JOIN users u ON u.id = ub.user_id
		ORDER BY ub.updated_at DESC
		LIMIT 10
	`)
	if err != nil {
		fmt.Printf("Error querying: %v\n", err)
		return
	}
	defer rows.Close()

	now := time.Now()
	fmt.Println("=== USER BONUSES ===")
	for rows.Next() {
		var userID, username string
		var lastCheckin, lastSpin *time.Time
		var streak int
		var createdAt time.Time
		rows.Scan(&userID, &username, &lastCheckin, &streak, &lastSpin, &createdAt)

		canCheckIn := true
		if lastCheckin != nil {
			if lastCheckin.Year() == now.Year() && lastCheckin.YearDay() == now.YearDay() {
				canCheckIn = false
			}
		}

		canSpin := true
		if lastSpin != nil {
			if lastSpin.Year() == now.Year() && lastSpin.YearDay() == now.YearDay() {
				canSpin = false
			}
		}

		fmt.Printf("User: %s (%s)\n", username, userID[:8])
		fmt.Printf("  Streak: %d\n", streak)
		fmt.Printf("  LastCheckin: %v (YearDay: %v)\n", lastCheckin, getYearDay(lastCheckin))
		fmt.Printf("  LastSpin: %v (YearDay: %v)\n", lastSpin, getYearDay(lastSpin))
		fmt.Printf("  CanCheckIn: %v | CanSpin: %v\n", canCheckIn, canSpin)
		fmt.Printf("  CreatedAt: %v\n\n", createdAt)
	}
}

func getYearDay(t *time.Time) string {
	if t == nil {
		return "nil"
	}
	return fmt.Sprintf("%d", t.YearDay())
}
