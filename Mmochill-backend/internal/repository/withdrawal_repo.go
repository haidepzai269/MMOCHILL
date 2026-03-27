package repository

import (
	"context"
	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func CreateWithdrawal(ctx context.Context, tx database.TxOrPool, w *models.Withdrawal) error {
	execer := tx
	if execer == nil {
		execer = database.Pool
	}
	query := `
		INSERT INTO withdrawals (user_id, amount, fee, net_amount, method, bank_name, account_number, account_name, phone_number, wallet_address, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at
	`
	err := execer.QueryRow(ctx, query, 
		w.UserID, w.Amount, w.Fee, w.NetAmount, w.Method, w.BankName, w.AccountNumber, w.AccountName, w.PhoneNumber, w.WalletAddress, w.Status).
		Scan(&w.ID, &w.CreatedAt)
	return err
}

func LockBalanceForWithdrawal(ctx context.Context, tx database.TxOrPool, userID string, amount int64) error {
	execer := tx
	if execer == nil {
		execer = database.Pool
	}
	query := `
		UPDATE wallets
		SET balance = balance - $1, locked_amount = locked_amount + $1, updated_at = NOW()
		WHERE user_id = $2 AND balance >= $1
	`
	tag, err := execer.Exec(ctx, query, amount, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return context.DeadlineExceeded // Hoặc lồi Số dư không đủ
	}
	return nil
}

func GetAllWithdrawals(ctx context.Context, status string) ([]models.Withdrawal, error) {
	query := `
		SELECT id, user_id, amount, fee, net_amount, method, bank_name, account_number, account_name, phone_number, wallet_address, status, created_at, updated_at
		FROM withdrawals
		WHERE ($1 = '' OR status = $1)
		ORDER BY created_at DESC
	`
	rows, err := database.Pool.Query(ctx, query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var withdrawals []models.Withdrawal
	for rows.Next() {
		var w models.Withdrawal
		err := rows.Scan(&w.ID, &w.UserID, &w.Amount, &w.Fee, &w.NetAmount, &w.Method, &w.BankName, &w.AccountNumber, &w.AccountName, &w.PhoneNumber, &w.WalletAddress, &w.Status, &w.CreatedAt, &w.UpdatedAt)
		if err != nil {
			return nil, err
		}
		withdrawals = append(withdrawals, w)
	}
	return withdrawals, nil
}
func GetWithdrawalByID(ctx context.Context, id string) (*models.Withdrawal, error) {
	query := `SELECT id, user_id, amount, status FROM withdrawals WHERE id = $1`
	var w models.Withdrawal
	err := database.Pool.QueryRow(ctx, query, id).Scan(&w.ID, &w.UserID, &w.Amount, &w.Status)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func UpdateWithdrawalStatus(ctx context.Context, id string, newStatus string) error {
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get withdrawal details
	w, err := GetWithdrawalByID(ctx, id)
	if err != nil {
		return err
	}

	if w.Status != "pending" {
		return context.Canceled // Already processed
	}

	// Update withdrawal status
	queryUpdate := `UPDATE withdrawals SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err = tx.Exec(ctx, queryUpdate, newStatus, id)
	if err != nil {
		return err
	}

	// Update Wallet
	if newStatus == "approved" {
		// Just clear locked amount
		queryWallet := `UPDATE wallets SET locked_amount = locked_amount - $1, updated_at = NOW() WHERE user_id = $2`
		_, err = tx.Exec(ctx, queryWallet, w.Amount, w.UserID)
	} else if newStatus == "rejected" {
		// Return to balance and clear locked amount
		queryWallet := `UPDATE wallets SET balance = balance + $1, locked_amount = locked_amount - $1, updated_at = NOW() WHERE user_id = $2`
		_, err = tx.Exec(ctx, queryWallet, w.Amount, w.UserID)
	}

	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
