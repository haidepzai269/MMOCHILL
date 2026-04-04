package main

import (
	"context"
	"fmt"
	"log"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/services"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("Error loading .env file:", err)
	}

	database.ConnectDB()
	database.ConnectRedis()

	bookService := &services.BookService{}
	ctx := context.Background()

	// 1. Khởi tạo metadata sách
	bookService.InitializeBooks(ctx)

	// 2. Thử cào chương 1 của cuốn đầu tiên
	books, err := bookService.GetAllBooks(ctx)
	if err != nil || len(books) == 0 {
		log.Fatalf("Không lấy được danh sách sách: %v", err)
	}

	targetBook := books[0]
	fmt.Printf("--- Kiểm tra cào sách: %s ---\n", targetBook.Title)

	chapter, err := bookService.GetOrCrawlChapter(ctx, targetBook.ID, 1)
	if err != nil {
		log.Fatalf("Lỗi cào chương 1: %v", err)
	}

	fmt.Printf("Tiêu đề chương 1: %s\n", chapter.Title)
	if len(chapter.Content) > 200 {
		fmt.Printf("Nội dung (trích đoạn): %s...\n", chapter.Content[:200])
	} else {
		fmt.Printf("Nội dung: %s\n", chapter.Content)
	}

	fmt.Println("\n--- Kiểm tra hoàn tất thành công! ---")
}
