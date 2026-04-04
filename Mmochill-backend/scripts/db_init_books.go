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
	-- Bảng lưu trữ thông tin sách
	CREATE TABLE IF NOT EXISTS public.books (
		id uuid DEFAULT gen_random_uuid() NOT NULL,
		title text NOT NULL,
		author text,
		description text,
		thumbnail text,
		category character varying(30) DEFAULT 'finance',
		source_url text UNIQUE,
		created_at timestamp with time zone DEFAULT now(),
		CONSTRAINT books_pkey PRIMARY KEY (id)
	);

	-- Bảng lưu trữ các chương của sách
	CREATE TABLE IF NOT EXISTS public.book_chapters (
		id uuid DEFAULT gen_random_uuid() NOT NULL,
		book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
		chapter_index integer NOT NULL,
		title text NOT NULL,
		content text NOT NULL,
		created_at timestamp with time zone DEFAULT now(),
		CONSTRAINT book_chapters_pkey PRIMARY KEY (id),
		UNIQUE (book_id, chapter_index)
	);

	CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
	CREATE INDEX IF NOT EXISTS idx_book_chapters_book_id ON public.book_chapters(book_id);
	`

	_, err = conn.Exec(context.Background(), sql)
	if err != nil {
		log.Fatalf("Error creating tables for books: %v\n", err)
	}

	fmt.Println("Tables books and book_chapters created successfully!")
}
