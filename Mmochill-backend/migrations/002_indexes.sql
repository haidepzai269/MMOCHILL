-- 9. INDEXES (bắt buộc)
CREATE INDEX IF NOT EXISTS idx_user_task_claims_user     ON user_task_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_claims_token    ON user_task_claims(bypass_token);
CREATE INDEX IF NOT EXISTS idx_user_task_claims_status   ON user_task_claims(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet          ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created        ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status        ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user          ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code       ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created       ON admin_audit_logs(created_at DESC);
