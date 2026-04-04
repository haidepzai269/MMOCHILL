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
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(context.Background())

	sql := `
	CREATE TABLE IF NOT EXISTS public.site_comments (
		id uuid DEFAULT gen_random_uuid() NOT NULL,
		user_id uuid, -- NULL cho bot
		username character varying(50), -- Tên hiển thị (User hoặc Bot)
		avatar_url text, -- Avatar (User hoặc Bot)
		content text NOT NULL,
		is_bot boolean DEFAULT false,
		created_at timestamp with time zone DEFAULT now(),
		CONSTRAINT site_comments_pkey PRIMARY KEY (id),
		CONSTRAINT site_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
	);
	`

	_, err = conn.Exec(context.Background(), sql)
	if err != nil {
		log.Fatalf("Error creating table: %v\n", err)
	}

	fmt.Println("Table site_comments created successfully!")
}
