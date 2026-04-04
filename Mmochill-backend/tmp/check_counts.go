package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := "postgresql://neondb_owner:npg_dW64btOohFwI@ep-steep-brook-a1kput0p-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
	
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	fmt.Println("Table counts:")
	tables := []string{"users", "wallets", "tasks", "user_task_claims", "withdrawals", "referrals"}
	for _, t := range tables {
		var count int
		err := pool.QueryRow(context.Background(), fmt.Sprintf("SELECT COUNT(*) FROM %s", t)).Scan(&count)
		if err != nil {
			fmt.Printf("- %s: NOT FOUND or error: %v\n", t, err)
		} else {
			fmt.Printf("- %s: %d rows\n", t, count)
		}
	}
}
