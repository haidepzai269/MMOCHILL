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

	var total int
	err = pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM notifications").Scan(&total)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Total notifications in DB: %d\n", total)

	if total > 0 {
		fmt.Println("\nChecking grouping logic...")
		query := `
			SELECT 
				MIN(id::text) as id, 
				title, 
				message, 
				group_id,
				COUNT(*) as recipient_count
			FROM notifications
			GROUP BY title, message, type, category, group_id, (CASE WHEN group_id IS NULL THEN id::text ELSE NULL END)
			ORDER BY MIN(created_at) DESC
			LIMIT 10
		`

		rows, err := pool.Query(context.Background(), query)
		if err != nil {
			log.Fatal(err)
		}
		defer rows.Close()

		for rows.Next() {
			var id, title, message string
			var groupID *string
			var count int
			if err := rows.Scan(&id, &title, &message, &groupID, &count); err != nil {
				log.Fatal(err)
			}
			gID := "NULL"
			if groupID != nil {
				gID = *groupID
			}
			fmt.Printf("Note: %s (Group: %s) - %d recipients - Title: %s\n", id, gID, count, title)
		}
	}
}
