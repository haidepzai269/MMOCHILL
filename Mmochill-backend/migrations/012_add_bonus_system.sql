-- 1. Cập nhật CHECK constraint cho wallet_transactions.type
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_type_check 
CHECK (type IN (
    'task_reward', 'withdrawal_deduct', 'withdrawal_refund', 
    'referral_bonus', 'admin_adjust', 'daily_checkin_reward', 'lucky_spin_reward'
));

-- 2. Tạo bảng user_bonuses để theo dõi điểm danh và vòng quay
CREATE TABLE IF NOT EXISTS user_bonuses (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_checkin_at  TIMESTAMPTZ,
    checkin_streak   INT DEFAULT 0,
    last_spin_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tạo index để truy vấn nhanh
CREATE INDEX IF NOT EXISTS idx_user_bonuses_user_id ON user_bonuses(user_id);
