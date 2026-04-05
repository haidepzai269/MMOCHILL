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

// AddWalletBalance cộng/trừ tiền vào ví với loại giao dịch cụ thể (phải chạy trong Transaction hoặc Pool)
func AddWalletBalance(ctx context.Context, tx database.TxOrPool, userID string, amount int64, txType models.TransactionType, refID string, note string) error {
	execer := tx
	if execer == nil {
		execer = database.Pool
	}

	// 1. Cập nhật Wallet
	queryWallet := `
		UPDATE wallets 
		SET balance = balance + $1, 
		    total_earned = CASE WHEN $1 > 0 THEN total_earned + $1 ELSE total_earned END, 
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
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = tx.Exec(ctx, queryTx, walletID, string(txType), amount, newBalance-amount, newBalance, refID, note)
	return err
}

// AddReward cộng tiền thưởng nhiệm vụ (giữ lại để tương thích ngược)
func AddReward(ctx context.Context, tx database.TxOrPool, userID string, amount int64, refID string, note string) error {
	return AddWalletBalance(ctx, tx, userID, amount, models.TxTaskReward, refID, note)
}

// GetTransactionsByWalletID lấy lịch sử giao dịch của ví, hỗ trợ phân trang
func GetTransactionsByWalletID(ctx context.Context, walletID string, limit, offset int) ([]models.WalletTransaction, error) {
	query := `
		SELECT id, wallet_id, type, amount, balance_before, balance_after, ref_id, note, created_at
		FROM wallet_transactions
		WHERE wallet_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := database.Pool.Query(ctx, query, walletID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []models.WalletTransaction
	for rows.Next() {
		var tx models.WalletTransaction
		err := rows.Scan(
			&tx.ID, &tx.WalletID, &tx.Type, &tx.Amount, &tx.BalanceBefore,
			&tx.BalanceAfter, &tx.RefID, &tx.Note, &tx.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, tx)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	// Return empty slice instead of nil if no transactions found
	if transactions == nil {
		transactions = []models.WalletTransaction{}
	}
	return transactions, nil
}
