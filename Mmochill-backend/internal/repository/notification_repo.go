package repository

import (
	"context"
	"github.com/google/uuid"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func GetNotificationsByUserID(ctx context.Context, userID string, limit, offset int) ([]models.Notification, int, error) {
	// 1. Get Total Count
	var total int
	err := database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM notifications WHERE user_id = $1", userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 2. Fetch Notifications
	query := `
		SELECT id, user_id, title, message, COALESCE(type, 'info'), COALESCE(category, 'system'), is_read, created_at 
		FROM notifications 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3
	`
	rows, err := database.Pool.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	notes := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &n.Category, &n.IsRead, &n.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		notes = append(notes, n)
	}
	return notes, total, nil
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

func AdminGetSentNotifications(ctx context.Context, limit, offset int) ([]models.Notification, int, error) {
	// 1. Get total count of unique notification groups
	totalQuery := `
		SELECT COUNT(*) FROM (
			SELECT 1 FROM notifications 
			GROUP BY title, message, type, category, group_id, (CASE WHEN group_id IS NULL THEN id::text ELSE NULL END)
		) sub
	`
	var total64 int64
	err := database.Pool.QueryRow(ctx, totalQuery).Scan(&total64)
	if err != nil {
		return nil, 0, err
	}

	// 2. Get paginated notifications with recipient info using a standard subquery
	query := `
		SELECT 
			sub.id, sub.title, sub.message, sub.type, sub.category, sub.created_at, sub.group_id, sub.recipient_count,
			CASE 
				WHEN sub.recipient_count = 1 THEN COALESCE(u.username, 'Người dùng')
				ELSE 'Toàn hệ thống'
			END as recipient_name
		FROM (
			SELECT 
				MIN(id::text) as id, 
				title, 
				message, 
				COALESCE(type, 'info') as type, 
				COALESCE(category, 'system') as category, 
				MAX(created_at) as created_at, 
				group_id::text as group_id,
				COUNT(*) as recipient_count,
				MIN(user_id::text) as min_user_id
			FROM notifications
			GROUP BY title, message, type, category, group_id, (CASE WHEN group_id IS NULL THEN id::text ELSE NULL END)
		) sub
		LEFT JOIN users u ON u.id::text = sub.min_user_id
		ORDER BY sub.created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := database.Pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	notes := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		var count64 int64
		err := rows.Scan(
			&n.ID, &n.Title, &n.Message, &n.Type, &n.Category, 
			&n.CreatedAt, &n.GroupID, &count64, &n.RecipientName,
		)
		if err != nil {
			return nil, 0, err
		}
		n.RecipientCount = int(count64)
		notes = append(notes, n)
	}
	return notes, int(total64), nil
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

func GetNotificationByID(ctx context.Context, id string, userID string) (*models.Notification, error) {
	query := `
		SELECT id, user_id, title, message, COALESCE(type, 'info'), COALESCE(category, 'system'), is_read, created_at, group_id
		FROM notifications 
		WHERE id = $1 AND user_id = $2
	`
	var n models.Notification
	err := database.Pool.QueryRow(ctx, query, id, userID).Scan(
		&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &n.Category, &n.IsRead, &n.CreatedAt, &n.GroupID,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}
