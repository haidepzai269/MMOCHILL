package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func CreateUser(user *models.User) error {
	ctx := context.Background()
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var serialID int
	query := `INSERT INTO users (email, username, password_hash, role, balance, referred_by, status, created_at, updated_at, is_vip) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8) 
            RETURNING id, referral_code, serial_id`
	err = tx.QueryRow(ctx, query,
		user.Email, user.Username, user.Password, user.Role, user.Balance,
		user.ReferredBy, "active", user.IsVIP).Scan(&user.ID, &user.ReferralCode, &serialID)
	if err != nil {
		return err
	}

	// Cập nhật DisplayID dựa trên serial_id
	user.DisplayID = fmt.Sprintf("2609%d", serialID)
	updateQuery := `UPDATE users SET display_id = $1 WHERE id = $2`
	_, err = tx.Exec(ctx, updateQuery, user.DisplayID, user.ID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func GetUserByEmail(email string) (*models.User, error) {
    query := `SELECT u.id, u.email, COALESCE(u.username, ''), u.password_hash, COALESCE(u.full_name, ''), COALESCE(u.phone, ''), COALESCE(u.display_id, ''), u.role, 
            COALESCE(w.balance, 0), COALESCE(w.locked_amount, 0), COALESCE(w.peak_balance, 0), COALESCE(w.total_earned, 0), COALESCE(w.total_withdrawn, 0),
            COALESCE(u.referral_code, ''), u.referred_by, COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at), u.sound_enabled, u.is_vip 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.email = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, email).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt, &user.SoundEnabled, &user.IsVIP,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByDisplayID(displayID string) (*models.User, error) {
	query := `SELECT u.id, u.email, COALESCE(u.username, ''), u.password_hash, COALESCE(u.full_name, ''), COALESCE(u.phone, ''), COALESCE(u.display_id, ''), u.role, 
            COALESCE(w.balance, 0), COALESCE(w.locked_amount, 0), COALESCE(w.peak_balance, 0), COALESCE(w.total_earned, 0), COALESCE(w.total_withdrawn, 0),
            COALESCE(u.referral_code, ''), u.referred_by, COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at), u.sound_enabled, u.is_vip 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.display_id = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, displayID).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt, &user.SoundEnabled, &user.IsVIP,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByReferralCode(code string) (*models.User, error) {
	query := `SELECT u.id, u.email, COALESCE(u.username, ''), u.password_hash, COALESCE(u.full_name, ''), COALESCE(u.phone, ''), COALESCE(u.display_id, ''), u.role, 
            COALESCE(w.balance, 0), COALESCE(w.locked_amount, 0), COALESCE(w.peak_balance, 0), COALESCE(w.total_earned, 0), COALESCE(w.total_withdrawn, 0),
            COALESCE(u.referral_code, ''), u.referred_by, COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at), u.sound_enabled, u.is_vip 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.referral_code = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, code).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt, &user.SoundEnabled, &user.IsVIP,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func CreateAdminIfNotExists(username, email, passwordHash string) error {
	existing, err := GetUserByEmail(email)
	if err == nil {
		if existing.Role != "admin" {
			query := `UPDATE users SET role = 'admin' WHERE email = $1`
			database.Pool.Exec(context.Background(), query, email)
		}
		return nil // Admin already exists or has been upgraded
	}

	user := &models.User{
		Username:  username,
		Email:     email,
		Password:  passwordHash,
		Role:      "admin",
		Status:    "active",
		DisplayID: "ADMIN",
	}
	return CreateUser(user)
}

func EnsureUserIsAdmin(email string) error {
	query := `UPDATE users SET role = 'admin' WHERE email = $1`
	_, err := database.Pool.Exec(context.Background(), query, email)
	return err
}

func UpdateProfile(userID, fullName, avatarURL string) error {
	query := `UPDATE users SET full_name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3`
	_, err := database.Pool.Exec(context.Background(), query, fullName, avatarURL, userID)
	return err
}

func SaveResetToken(email, token string) error {
	ctx := context.Background()
	return database.RedisClient.Set(ctx, "reset_token:"+token, email, 15*time.Minute).Err()
}

func GetEmailByResetToken(token string) (string, error) {
	ctx := context.Background()
	return database.RedisClient.Get(ctx, "reset_token:"+token).Result()
}

func UpdatePassword(email, hashedPwd string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2`
	_, err := database.Pool.Exec(context.Background(), query, hashedPwd, email)
	return err
}

func UpdateEmail(userID, newEmail string) error {
	query := `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`
	_, err := database.Pool.Exec(context.Background(), query, newEmail, userID)
	return err
}

func GetUserByID(id string) (*models.User, error) {
	query := `SELECT u.id, u.email, COALESCE(u.username, ''), u.password_hash, COALESCE(u.full_name, ''), COALESCE(u.phone, ''), COALESCE(u.display_id, ''), u.role, 
            COALESCE(w.balance, 0), COALESCE(w.locked_amount, 0), COALESCE(w.peak_balance, 0), COALESCE(w.total_earned, 0), COALESCE(w.total_withdrawn, 0),
            COALESCE(u.referral_code, ''), u.referred_by, COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at), u.sound_enabled, u.is_vip 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.id = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, id).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt, &user.SoundEnabled, &user.IsVIP,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func SaveCredential(ctx context.Context, cred *models.UserCredential) error {
	query := `INSERT INTO user_credentials (id, user_id, public_key, attestation_type, aaguid, sign_count, transport, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`
	_, err := database.Pool.Exec(ctx, query,
		cred.ID, cred.UserID, cred.PublicKey, cred.AttestationType, cred.AAGUID, cred.SignCount, cred.Transport)
	return err
}

func GetCredentialsByUserID(ctx context.Context, userID string) ([]models.UserCredential, error) {
	query := `SELECT id, user_id, public_key, attestation_type, aaguid, sign_count, transport, created_at FROM user_credentials WHERE user_id = $1`
	rows, err := database.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var creds []models.UserCredential
	for rows.Next() {
		var c models.UserCredential
		err := rows.Scan(&c.ID, &c.UserID, &c.PublicKey, &c.AttestationType, &c.AAGUID, &c.SignCount, &c.Transport, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		creds = append(creds, c)
	}
	return creds, nil
}

func UpdateCredentialSignCount(ctx context.Context, credID []byte, signCount uint32) error {
	query := `UPDATE user_credentials SET sign_count = $1 WHERE id = $2`
	_, err := database.Pool.Exec(ctx, query, signCount, credID)
	return err
}

func GetAllUsers(ctx context.Context, limit, offset int, search string, filter string) ([]models.User, int, error) {
	var users []models.User
	var total int

	// Base conditions for counting total
	whereClause := "WHERE (u.email ILIKE $1 OR u.username ILIKE $1 OR u.full_name ILIKE $1)"
	if filter == "has_completed_tasks" {
		whereClause += " AND EXISTS (SELECT 1 FROM user_task_claims c WHERE c.user_id = u.id AND c.status = 'completed')"
	}

	// Count total for pagination
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users u %s", whereClause)
	err := database.Pool.QueryRow(ctx, countQuery, "%"+search+"%").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT u.id, u.email, COALESCE(u.username, ''), COALESCE(u.full_name, ''), COALESCE(u.display_id, ''), u.role, 
		COALESCE(w.balance, 0) as balance, 
		COALESCE(u.status, 'active'), u.created_at, COALESCE(u.avatar_url, ''),
		COALESCE(tc.completed_count, 0) as completed_tasks_count
		FROM users u
		LEFT JOIN wallets w ON u.id = w.user_id
		LEFT JOIN (
			SELECT user_id, COUNT(*) as completed_count
			FROM user_task_claims
			WHERE status = 'completed'
			GROUP BY user_id
		) tc ON tc.user_id = u.id
		%s
		ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`, whereClause)

	rows, err := database.Pool.Query(ctx, query, "%"+search+"%", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Email, &u.Username, &u.FullName, &u.DisplayID, &u.Role, &u.Balance, &u.Status, &u.CreatedAt, &u.AvatarURL, &u.CompletedTasksCount)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
}

func UpdateUserStatus(ctx context.Context, userID, status string) error {
	query := `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := database.Pool.Exec(ctx, query, status, userID)
	return err
}

func GetReferralStats(ctx context.Context, userID string) (int, int64, []models.User, error) {
	var totalInvited int
	var totalCommission int64
	invitedUsers := []models.User{}

	// 1. Đếm tổng số người đã mời
	countQuery := `SELECT COUNT(*) FROM users WHERE referred_by = $1`
	err := database.Pool.QueryRow(ctx, countQuery, userID).Scan(&totalInvited)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("failed to count invited users: %v", err)
	}

	// 2. Tính tổng hoa hồng nhận được
	commissionQuery := `
		SELECT COALESCE(SUM(wt.amount), 0)
		FROM wallet_transactions wt
		JOIN wallets w ON wt.wallet_id = w.id
		WHERE w.user_id = $1 AND wt.type = 'referral_bonus'
	`
	err = database.Pool.QueryRow(ctx, commissionQuery, userID).Scan(&totalCommission)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("failed to sum commissions: %v", err)
	}

	// 3. Lấy danh sách bạn bè đã mời (giới hạn một số thông tin cần thiết)
	usersQuery := `
		SELECT id, email, COALESCE(username, ''), COALESCE(full_name, ''), created_at 
		FROM users 
		WHERE referred_by = $1 
		ORDER BY created_at DESC
	`
	rows, err := database.Pool.Query(ctx, usersQuery, userID)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("failed to get invited users: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Email, &u.Username, &u.FullName, &u.CreatedAt)
		if err != nil {
			return 0, 0, nil, fmt.Errorf("failed to scan user: %v", err)
		}
		invitedUsers = append(invitedUsers, u)
	}

	return totalInvited, totalCommission, invitedUsers, nil
}

func UpdateSoundPreference(userID string, enabled bool) error {
	query := `UPDATE users SET sound_enabled = $1, updated_at = NOW() WHERE id = $2`
	_, err := database.Pool.Exec(context.Background(), query, enabled, userID)
	return err
}
