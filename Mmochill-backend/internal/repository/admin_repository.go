package repository

import (
	"context"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func GetAdminStats(ctx context.Context) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	var totalUsers int
	err := database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&totalUsers)
	if err != nil {
		return nil, err
	}
	stats["total_users"] = totalUsers

	var activeTasks int
	err = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM tasks WHERE is_active = true").Scan(&activeTasks)
	if err != nil {
		return nil, err
	}
	stats["active_tasks"] = activeTasks

	var totalEarned int64
	query := `
		SELECT COALESCE(SUM(t.reward), 0)::BIGINT
		FROM user_task_claims c
		JOIN tasks t ON c.task_id = t.id
		WHERE c.status = 'completed'
	`
	err = database.Pool.QueryRow(ctx, query).Scan(&totalEarned)
	if err != nil {
		return nil, err
	}
	stats["total_earned"] = totalEarned

	var pendingWithdrawals int
	err = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'").Scan(&pendingWithdrawals)
	if err != nil {
		return nil, err
	}
	stats["pending_withdrawals"] = pendingWithdrawals

	return stats, nil
}

func CreateAuditLog(ctx context.Context, log *models.AuditLog) error {
	query := `INSERT INTO audit_logs (admin_id, action, target_id, details, ip_address, created_at) 
            VALUES ($1, $2, $3, $4, $5, NOW())`
	_, err := database.Pool.Exec(ctx, query, log.AdminID, log.Action, log.TargetID, log.Details, log.IPAddress)
	return err
}

func GetAuditLogs(ctx context.Context, limit, offset int) ([]models.AuditLog, error) {
	query := `SELECT id, admin_id, action, target_id, details, ip_address, created_at 
            FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := database.Pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		err := rows.Scan(&l.ID, &l.AdminID, &l.Action, &l.TargetID, &l.Details, &l.IPAddress, &l.CreatedAt)
		if err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}
