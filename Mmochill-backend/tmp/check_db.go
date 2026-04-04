package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := "postgresql://neondb_owner:npg_dW64btOohFwI@ep-cold-credit-a1yhv8as-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
	
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	fmt.Println("Checking for invalid UUIDs (empty strings)...")
	
	// We check for rows where columns expected to be UUIDs might have been set to empty string (manually)
	// Though if the column is type UUID, Postgres won't even let you set it to '' via a normal UPDATE.
	// But if someone used a tool that casted it, or if they changed the column type...
	
	rows, err := pool.Query(context.Background(), "SELECT email, id, CAST(referred_by AS TEXT) FROM users")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var email, id string
		var referredBy *string
		if err := rows.Scan(&email, &id, &referredBy); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		refStr := "NULL"
		if referredBy != nil {
			refStr = fmt.Sprintf("'%s'", *referredBy)
		}
		fmt.Printf("User: %s (ID: %s), ReferredBy: %s\n", email, id, refStr)
	}
}
