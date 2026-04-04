package main

import (
	"context"
	"fmt"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.ConnectDB()

	ctx := context.Background()
	
	// Cập nhật tất cả user bị thiếu mã mời
	res, err := database.Pool.Exec(ctx, "UPDATE users SET referral_code = '3112' || serial_id WHERE referral_code IS NULL OR referral_code = ''")
	if err != nil {
		fmt.Printf("Update failed: %v\n", err)
	} else {
		fmt.Printf("Updated users: %d\n", res.RowsAffected())
	}

	// Kiểm tra user hiện tại (DisplayID: 26094)
	var refCode string
	err = database.Pool.QueryRow(ctx, "SELECT COALESCE(referral_code, 'NULL') FROM users WHERE display_id = '26094'").Scan(&refCode)
	if err != nil {
		fmt.Printf("Query error for 26094: %v\n", err)
	} else {
		fmt.Printf("Current User (26094) Referral Code: [%s]\n", refCode)
	}
}
