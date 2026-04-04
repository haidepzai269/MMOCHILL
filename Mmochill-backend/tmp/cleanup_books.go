package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/jackc/pgx/v4/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/mmochill?sslmode=disable"
	}
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("DB Connect Error: %v", err)
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{Addr: redisURL})
	defer rdb.Close()

	fmt.Println("=== CLEANING ACADEMY DATA ===")
	
	// 1. Xóa toàn bộ chương sách cũ (để cào lại từ nguồn mới chuẩn)
	res, err := pool.Exec(ctx, "DELETE FROM public.book_chapters")
	if err != nil {
		log.Printf("Delete chapters error: %v", err)
	} else {
		fmt.Printf("Deleted chapters: %d\n", res.RowsAffected())
	}

	// 2. Chỉnh sửa URL sách trong DB về rỗng để ép InitializeBooks chạy lại (hoặc cập nhật trực tiếp)
	// Để bạo lực nhất, ta xóa hết sách và để InitializeBooks tạo lại từ đầu
	res, err = pool.Exec(ctx, "DELETE FROM public.books")
	if err != nil {
		log.Printf("Delete books error: %v", err)
	} else {
		fmt.Printf("Reset books: %d\n", res.RowsAffected())
	}

	// 3. Xóa sạch Redis
	err = rdb.FlushAll(ctx).Err()
	if err != nil {
		log.Printf("Redis flush error: %v", err)
	} else {
		fmt.Println("Redis cleared.")
	}

	fmt.Println("=== CLEANUP FINISHED. PLEASE RESTART BACKEND. ===")
}
