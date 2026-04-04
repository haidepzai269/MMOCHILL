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

	var exists bool
	query := `SELECT EXISTS (
	   SELECT FROM information_schema.tables 
	   WHERE  table_schema = 'public'
	   AND    table_name   = 'user_bonuses'
	);`

	err := database.Pool.QueryRow(context.Background(), query).Scan(&exists)
	if err != nil {
		log.Fatalf("Lỗi kiểm tra bảng: %v", err)
	}

	if exists {
		fmt.Println("✅ Bảng user_bonuses đã tồn tại.")
		
		// Kiểm tra các cột
		rows, err := database.Pool.Query(context.Background(), "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_bonuses'")
		if err != nil {
			log.Fatalf("Lỗi kiểm tra cột: %v", err)
		}
		defer rows.Close()

		fmt.Println("Cấu trúc bảng:")
		for rows.Next() {
			var col, dtype string
			rows.Scan(&col, &dtype)
			fmt.Printf("- %s: %s\n", col, dtype)
		}
	} else {
		fmt.Println("❌ Bảng user_bonuses CHƯA TỒN TẠI!")
	}
}
