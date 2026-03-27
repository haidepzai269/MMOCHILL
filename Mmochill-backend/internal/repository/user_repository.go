package repository

import (
	"context"
	"time"

	"github.com/QuangVuDuc006/mmochill-backend/internal/database"
	"github.com/QuangVuDuc006/mmochill-backend/internal/models"
)

func CreateUser(user *models.User) error {
	query := `INSERT INTO users (email, username, password_hash, display_id, role, balance, referred_by, status, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
            RETURNING id, referral_code`
	err := database.Pool.QueryRow(context.Background(), query,
		user.Email, user.Username, user.Password, user.DisplayID, user.Role, user.Balance,
		user.ReferredBy, "active").Scan(&user.ID, &user.ReferralCode)
	return err
}

func GetUserByEmail(email string) (*models.User, error) {
	query := `SELECT u.id, u.email, COALESCE(u.username, ''), u.password_hash, COALESCE(u.full_name, ''), COALESCE(u.phone, ''), COALESCE(u.display_id, ''), u.role, 
            COALESCE(w.balance, 0), COALESCE(w.locked_amount, 0), COALESCE(w.peak_balance, 0), COALESCE(w.total_earned, 0), COALESCE(w.total_withdrawn, 0),
            COALESCE(u.referral_code, ''), COALESCE(u.referred_by, ''), COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at) 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.email = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, email).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByDisplayID(displayID string) (*models.User, error) {
	query := `SELECT u.id, u.email, COALESCE(u.username, ''), u.password_hash, COALESCE(u.full_name, ''), COALESCE(u.phone, ''), COALESCE(u.display_id, ''), u.role, 
            COALESCE(w.balance, 0), COALESCE(w.locked_amount, 0), COALESCE(w.peak_balance, 0), COALESCE(w.total_earned, 0), COALESCE(w.total_withdrawn, 0),
            COALESCE(u.referral_code, ''), COALESCE(u.referred_by, ''), COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at) 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.display_id = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, displayID).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByReferralCode(code string) (*models.User, error) {
	query := `SELECT u.id, u.email, COALESCE(u.username, ''), u.password_hash, COALESCE(u.full_name, ''), COALESCE(u.phone, ''), COALESCE(u.display_id, ''), u.role, 
            COALESCE(w.balance, 0), COALESCE(w.locked_amount, 0), COALESCE(w.peak_balance, 0), COALESCE(w.total_earned, 0), COALESCE(w.total_withdrawn, 0),
            COALESCE(u.referral_code, ''), COALESCE(u.referred_by, ''), COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at) 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.referral_code = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, code).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func GetLastDisplayID() (int, error) {
	var lastID int
	query := `SELECT COALESCE(MAX(CAST(SUBSTRING(display_id, 5) AS INTEGER)), 0) FROM users`
	err := database.Pool.QueryRow(context.Background(), query).Scan(&lastID)
	return lastID, err
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
            COALESCE(u.referral_code, ''), COALESCE(u.referred_by, ''), COALESCE(u.avatar_url, ''), COALESCE(u.status, 'active'), 
            u.created_at, COALESCE(u.updated_at, u.created_at) 
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.id = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(context.Background(), query, id).Scan(
		&user.ID, &user.Email, &user.Username, &user.Password, &user.FullName, &user.Phone, &user.DisplayID, &user.Role,
		&user.Balance, &user.LockedAmount, &user.PeakBalance, &user.TotalEarned, &user.TotalWithdrawn,
		&user.ReferralCode, &user.ReferredBy, &user.AvatarURL, &user.Status, &user.CreatedAt, &user.UpdatedAt,
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

func GetAllUsers(ctx context.Context, limit, offset int, search string) ([]models.User, int, error) {
	var users []models.User
	var total int

	// Count total for pagination
	countQuery := `SELECT COUNT(*) FROM users WHERE email ILIKE $1 OR username ILIKE $1 OR full_name ILIKE $1`
	err := database.Pool.QueryRow(ctx, countQuery, "%"+search+"%").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `SELECT id, email, COALESCE(username, ''), COALESCE(full_name, ''), COALESCE(display_id, ''), role, balance, 
            COALESCE(status, 'active'), created_at 
            FROM users 
            WHERE email ILIKE $3 OR username ILIKE $3 OR full_name ILIKE $3
            ORDER BY created_at DESC LIMIT $1 OFFSET $2`

	rows, err := database.Pool.Query(ctx, query, limit, offset, "%"+search+"%")
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Email, &u.Username, &u.FullName, &u.DisplayID, &u.Role, &u.Balance, &u.Status, &u.CreatedAt)
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
