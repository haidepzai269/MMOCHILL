package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
	"github.com/jackc/pgx/v5"
)

func GetOrCreateUserBonus(ctx context.Context, userID string) (*models.UserBonus, error) {
	var ub models.UserBonus
	query := `SELECT user_id, last_checkin_at, checkin_streak, last_spin_at, created_at, updated_at 
              FROM user_bonuses WHERE user_id = $1::uuid`
	
	err := database.Pool.QueryRow(ctx, query, userID).Scan(
		&ub.UserID, &ub.LastCheckinAt, &ub.CheckinStreak, &ub.LastSpinAt, &ub.CreatedAt, &ub.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		// Tạo mới nếu chưa có
		insertQuery := `INSERT INTO user_bonuses (user_id, checkin_streak, created_at, updated_at) 
                        VALUES ($1::uuid, 0, NOW(), NOW()) 
                        RETURNING user_id, last_checkin_at, checkin_streak, last_spin_at, created_at, updated_at`
		err = database.Pool.QueryRow(ctx, insertQuery, userID).Scan(
			&ub.UserID, &ub.LastCheckinAt, &ub.CheckinStreak, &ub.LastSpinAt, &ub.CreatedAt, &ub.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert user_bonus: %v", err)
		}
		return &ub, nil
	}

	if err != nil {
		return nil, err
	}
	return &ub, nil
}

func PerformCheckIn(ctx context.Context, userID string, reward int64) (int, error) {
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	// 1. Lấy thông tin bonus hiện tại
	var streak int
	var lastCheckin *time.Time
	err = tx.QueryRow(ctx, "SELECT checkin_streak, last_checkin_at FROM user_bonuses WHERE user_id = $1 FOR UPDATE", userID).Scan(&streak, &lastCheckin)
	if err != nil {
		return 0, err
	}

	// Kiểm tra xem đã điểm danh trong ngày chưa (Reset lúc 0h múi giờ VN)
	location, _ := time.LoadLocation("Asia/Ho_Chi_Minh")
	if location == nil {
		location = time.Local
	}
	now := time.Now().In(location)

	if lastCheckin != nil {
		lastLocal := lastCheckin.In(location)
		if lastLocal.Year() == now.Year() && lastLocal.YearDay() == now.YearDay() {
			return 0, fmt.Errorf("Bạn đã điểm danh ngày hôm nay rồi")
		}

		// Kiểm tra xem có bị đứt chuỗi không (quá 1 ngày)
		yesterday := now.AddDate(0, 0, -1)
		if lastLocal.Year() != yesterday.Year() || lastLocal.YearDay() != yesterday.YearDay() {
			streak = 0 // Đứt chuỗi
		}
	}

	// Tăng streak (Max 7 ngày)
	newStreak := (streak % 7) + 1

	// 2. Cập nhật user_bonuses
	updateBonusQuery := `UPDATE user_bonuses SET last_checkin_at = $1, checkin_streak = $2, updated_at = NOW() WHERE user_id = $3`
	_, err = tx.Exec(ctx, updateBonusQuery, now, newStreak, userID)
	if err != nil {
		return 0, err
	}

	// 3. Cộng tiền vào Wallet
	var walletID string
	var balanceBefore int64
	err = tx.QueryRow(ctx, "SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE", userID).Scan(&walletID, &balanceBefore)
	if err != nil {
		return 0, err
	}

	balanceAfter := balanceBefore + reward
	_, err = tx.Exec(ctx, "UPDATE wallets SET balance = $1, total_earned = total_earned + $2, updated_at = NOW() WHERE id = $3", balanceAfter, reward, walletID)
	if err != nil {
		return 0, err
	}

	// 4. Ghi log transaction
	txLogQuery := `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, note, created_at) 
                   VALUES ($1, $2, $3, $4, $5, $6, NOW())`
	_, err = tx.Exec(ctx, txLogQuery, walletID, models.TxDailyCheckinReward, reward, balanceBefore, balanceAfter, fmt.Sprintf("Ngày %d điểm danh liên tiếp", newStreak))
	if err != nil {
		return 0, err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return 0, err
	}

	return newStreak, nil
}

func PerformLuckySpin(ctx context.Context, userID string, reward int64, label string) error {
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Kiểm tra lượt quay trong ngày (Múi giờ VN)
	var lastSpin *time.Time
	err = tx.QueryRow(ctx, "SELECT last_spin_at FROM user_bonuses WHERE user_id = $1 FOR UPDATE", userID).Scan(&lastSpin)
	if err != nil {
		return err
	}

	location, _ := time.LoadLocation("Asia/Ho_Chi_Minh")
	if location == nil {
		location = time.Local
	}
	now := time.Now().In(location)

	if lastSpin != nil {
		lastLocal := lastSpin.In(location)
		if lastLocal.Year() == now.Year() && lastLocal.YearDay() == now.YearDay() {
			return fmt.Errorf("Bạn đã quay thưởng ngày hôm nay rồi")
		}
	}

	// 2. Cập nhật last_spin_at
	_, err = tx.Exec(ctx, "UPDATE user_bonuses SET last_spin_at = $1, updated_at = NOW() WHERE user_id = $2", now, userID)
	if err != nil {
		return err
	}

	// 3. Nếu trúng tiền thì cộng vào ví
	if reward > 0 {
		var walletID string
		var balanceBefore int64
		err = tx.QueryRow(ctx, "SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE", userID).Scan(&walletID, &balanceBefore)
		if err != nil {
			return err
		}

		balanceAfter := balanceBefore + reward
		_, err = tx.Exec(ctx, "UPDATE wallets SET balance = $1, total_earned = total_earned + $2, updated_at = NOW() WHERE id = $3", balanceAfter, reward, walletID)
		if err != nil {
			return err
		}

		// Ghi log transaction
		txLogQuery := `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, note, created_at) 
                       VALUES ($1, $2, $3, $4, $5, $6, NOW())`
		_, err = tx.Exec(ctx, txLogQuery, walletID, models.TxLuckySpinReward, reward, balanceBefore, balanceAfter, fmt.Sprintf("Trúng thưởng từ Vòng quay may mắn: %s", label))
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
