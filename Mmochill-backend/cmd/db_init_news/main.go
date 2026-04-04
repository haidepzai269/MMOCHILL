package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("Error loading .env file:", err)
	}

	dbURL := os.Getenv("DATABASE_URL")
	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(context.Background())

	sql := `
	-- Xóa table site_comments cũ nếu đã tạo (nếu cần)
	-- CREATE TABLE IF NOT EXISTS public.site_comments ... (đã làm bước trước)

	-- Bảng lưu trữ tin tức hàng ngày
	CREATE TABLE IF NOT EXISTS public.daily_news (
		id uuid DEFAULT gen_random_uuid() NOT NULL,
		source character varying(50) NOT NULL,
		category character varying(30) NOT NULL,
		title text NOT NULL,
		description text,
		url text UNIQUE NOT NULL,
		thumbnail text,
		published_at timestamp with time zone,
		created_at timestamp with time zone DEFAULT now(),
		CONSTRAINT daily_news_pkey PRIMARY KEY (id)
	);

	-- Bảng lưu trữ nội dung bài báo đã cào (Cache)
	CREATE TABLE IF NOT EXISTS public.news_cache (
		id uuid DEFAULT gen_random_uuid() NOT NULL,
		url text UNIQUE NOT NULL,
		title text NOT NULL,
		content text[] NOT NULL,
		images text[],
		created_at timestamp with time zone DEFAULT now(),
		CONSTRAINT news_cache_pkey PRIMARY KEY (id)
	);

	CREATE INDEX IF NOT EXISTS idx_daily_news_category ON public.daily_news(category);
	CREATE INDEX IF NOT EXISTS idx_news_cache_url ON public.news_cache(url);
	`

	_, err = conn.Exec(context.Background(), sql)
	if err != nil {
		log.Fatalf("Error creating tables: %v\n", err)
	}

	fmt.Println("Tables daily_news and news_cache created successfully!")
}
