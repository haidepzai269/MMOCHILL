package repository

import (
	"context"
	"github.com/google/uuid"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func GetNotificationsByUserID(ctx context.Context, userID string) ([]models.Notification, error) {
	query := `
		SELECT id, user_id, title, message, COALESCE(type, 'info'), COALESCE(category, 'system'), is_read, created_at 
		FROM notifications 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT 30
	`
	rows, err := database.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []models.Notification
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &n.Category, &n.IsRead, &n.CreatedAt)
		if err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, nil
}

func CreateNotification(ctx context.Context, tx database.TxOrPool, userID, title, message, nType, category string) error {
	if category == "" {
		category = "system"
	}

	execer := tx
	if execer == nil {
		execer = database.Pool
	}

	query := `
		INSERT INTO notifications (user_id, title, message, type, category)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := execer.Exec(ctx, query, userID, title, message, nType, category)
	return err
}

func CreateGlobalNotification(ctx context.Context, title, message, nType, category string) error {
	if category == "" {
		category = "system"
	}
	// Generate a unique group_id for this batch
	groupID := uuid.New().String()
	
	// Insert for all non-banned users (including those with NULL/empty status)
	query := `
		INSERT INTO notifications (user_id, title, message, type, category, group_id)
		SELECT id, $1, $2, $3, $4, $5 FROM users WHERE COALESCE(status, '') != 'banned'
	`
	_, err := database.Pool.Exec(ctx, query, title, message, nType, category, groupID)
	return err
}

func AdminGetSentNotifications(ctx context.Context) ([]models.Notification, error) {
	// Group by title, message, and group_id to see unique sent messages
	query := `
		SELECT DISTINCT ON (COALESCE(group_id::text, id::text)) 
			id, title, message, type, category, is_read, created_at, group_id
		FROM notifications
		ORDER BY COALESCE(group_id::text, id::text), created_at DESC
		LIMIT 50
	`
	// Since we want latest, we should sort by created_at first then distinct. 
	// Correct query for latest unique messages:
	query = `
		SELECT id, title, message, type, category, is_read, created_at, group_id
		FROM (
			SELECT DISTINCT ON (COALESCE(group_id::text, id::text)) *
			FROM notifications
			ORDER BY COALESCE(group_id::text, id::text), created_at DESC
		) sub
		ORDER BY created_at DESC
		LIMIT 50
	`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []models.Notification
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(&n.ID, &n.Title, &n.Message, &n.Type, &n.Category, &n.IsRead, &n.CreatedAt, &n.GroupID)
		if err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, nil
}

func AdminDeleteNotification(ctx context.Context, id, groupID string) error {
	if groupID != "" {
		query := `DELETE FROM notifications WHERE group_id = $1`
		_, err := database.Pool.Exec(ctx, query, groupID)
		return err
	}
	query := `DELETE FROM notifications WHERE id = $1`
	_, err := database.Pool.Exec(ctx, query, id)
	return err
}

func AdminBulkDeleteNotifications(ctx context.Context, ids []string, groupIDs []string) error {
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if len(ids) > 0 {
		query := `DELETE FROM notifications WHERE id = ANY($1)`
		_, err = tx.Exec(ctx, query, ids)
		if err != nil {
			return err
		}
	}

	if len(groupIDs) > 0 {
		query := `DELETE FROM notifications WHERE group_id = ANY($1)`
		_, err = tx.Exec(ctx, query, groupIDs)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func MarkNotificationAsRead(ctx context.Context, id string, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`
	_, err := database.Pool.Exec(ctx, query, id, userID)
	return err
}

func MarkAllNotificationsAsRead(ctx context.Context, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`
	_, err := database.Pool.Exec(ctx, query, userID)
	return err
}
