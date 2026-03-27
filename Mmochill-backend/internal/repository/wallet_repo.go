package repository

import (
	"context"
	"fmt"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

// GetWalletByUserID rẽ lấy wallet và lock row để đảm bảo tính atomic (SELECT FOR UPDATE)
func GetWalletByUserID(ctx context.Context, userID string) (*models.Wallet, error) {
	query := `
		SELECT id, user_id, balance, locked_amount, peak_balance, total_earned, total_withdrawn, updated_at 
		FROM wallets 
		WHERE user_id = $1 
		FOR UPDATE
	`
	var w models.Wallet
	err := database.Pool.QueryRow(ctx, query, userID).
		Scan(&w.ID, &w.UserID, &w.Balance, &w.LockedAmount, &w.PeakBalance, &w.TotalEarned, &w.TotalWithdrawn, &w.UpdatedAt)

	if err != nil {
		return nil, err
	}
	return &w, nil
}

func CreateWallet(ctx context.Context, userID string) error {
	query := `INSERT INTO wallets (user_id) VALUES ($1)`
	_, err := database.Pool.Exec(ctx, query, userID)
	return err
}

// AddReward cộng tiền thưởng nhiệm vụ (phải chạy trong Transaction)
func AddReward(ctx context.Context, tx database.TxOrPool, userID string, amount int64, refID string, note string) error {
	execer := tx
	if execer == nil {
		execer = database.Pool
	}

	// 1. Cập nhật Wallet
	queryWallet := `
		UPDATE wallets 
		SET balance = balance + $1, 
		    total_earned = total_earned + $1, 
		    peak_balance = GREATEST(peak_balance, balance + $1),
		    updated_at = NOW() 
		WHERE user_id = $2 
		RETURNING id, balance
	`
	var walletID string
	var newBalance int64
	err := execer.QueryRow(ctx, queryWallet, amount, userID).Scan(&walletID, &newBalance)
	if err != nil {
		return fmt.Errorf("failed to update wallet: %v", err)
	}

	// 2. Ghi log Transaction
	queryTx := `
		INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, ref_id, note)
		VALUES ($1, 'task_reward', $2, $3, $4, $5, $6)
	`
	_, err = tx.Exec(ctx, queryTx, walletID, amount, newBalance-amount, newBalance, refID, note)
	return err
}
