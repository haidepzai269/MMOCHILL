package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/go-redis/redis/v8"
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

	ctx := context.Background()
	pool, err := pgxpool.Connect(ctx, dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{Addr: redisURL})
	defer rdb.Close()

	fmt.Println("=== CHECKING BOOKS IN DB ===")
	rows, _ := pool.Query(ctx, "SELECT id, title, source_url FROM public.books")
	for rows.Next() {
		var id string
		var title, url string
		rows.Scan(&id, &title, &url)
		fmt.Printf("ID: %s | Title: %s | URL: %s\n", id, title, url)
	}

	fmt.Println("\n=== CLEARING ERRONEOUS CHAPTERS ===")
	// Xóa các chương sách đang bị lỗi (content rỗng hoặc chứa từ khóa lỗi)
	res, _ := pool.Exec(ctx, "DELETE FROM public.book_chapters")
	fmt.Printf("Deleted chapter rows: %d\n", res.RowsAffected())

	// Flush Redis để đảm bảo cào mới
	rdb.FlushAll(ctx)
	fmt.Println("Redis flushed.")
}
