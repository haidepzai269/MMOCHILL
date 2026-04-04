package repository

import (
	"context"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func CreateClaim(ctx context.Context, claim *models.UserTaskClaim) error {
	query := `
		INSERT INTO user_task_claims (user_id, task_id, bypass_token, bypass_token_expires, bypass_url, status, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, claimed_at
	`
	err := database.Pool.QueryRow(ctx, query, 
		claim.UserID, claim.TaskID, claim.BypassToken, claim.BypassTokenExpires, claim.BypassURL, claim.Status, claim.IPAddress, claim.UserAgent).
		Scan(&claim.ID, &claim.ClaimedAt)
	return err
}

func GetClaimByToken(ctx context.Context, token string) (*models.UserTaskClaim, error) {
	query := `
		SELECT id, user_id, task_id, status, bypass_token, bypass_token_expires, bypass_url, claimed_at, started_at, completed_at, ip_address::TEXT, user_agent
		FROM user_task_claims
		WHERE bypass_token = $1
	`
	var c models.UserTaskClaim
	err := database.Pool.QueryRow(ctx, query, token).
		Scan(&c.ID, &c.UserID, &c.TaskID, &c.Status, &c.BypassToken, &c.BypassTokenExpires, &c.BypassURL, 
			&c.ClaimedAt, &c.StartedAt, &c.CompletedAt, &c.IPAddress, &c.UserAgent)
	
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func UpdateClaimStatus(ctx context.Context, tx database.TxOrPool, id string, status models.ClaimStatus) error {
	execer := tx
	if execer == nil {
		execer = database.Pool
	}
	query := `UPDATE user_task_claims SET status=$1, completed_at=NOW() WHERE id=$2`
	_, err := execer.Exec(ctx, query, status, id)
	return err
}
func GetAllClaims(ctx context.Context, limit, offset int) ([]models.UserTaskClaimDetail, int, error) {
	query := `
		SELECT 
			c.id, c.user_id, c.task_id, c.status, c.bypass_url, c.claimed_at, c.completed_at, c.ip_address::TEXT,
			u.username, t.title as task_title, t.reward
		FROM user_task_claims c
		LEFT JOIN users u ON c.user_id = u.id
		LEFT JOIN tasks t ON c.task_id = t.id
		ORDER BY c.claimed_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := database.Pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var claims []models.UserTaskClaimDetail
	for rows.Next() {
		var c models.UserTaskClaimDetail
		err := rows.Scan(
			&c.ID, &c.UserID, &c.TaskID, &c.Status, &c.BypassURL, &c.ClaimedAt, &c.CompletedAt, &c.IPAddress,
			&c.Username, &c.TaskTitle, &c.Reward,
		)
		if err != nil {
			return nil, 0, err
		}
		claims = append(claims, c)
	}

	var total int
	err = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM user_task_claims").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return claims, total, nil
}
