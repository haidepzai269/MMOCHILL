-- Add peak_balance to wallets table to track highest balance reached
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS peak_balance BIGINT DEFAULT 0;

-- Initialize peak_balance with current balance for existing users
UPDATE wallets SET peak_balance = balance WHERE peak_balance = 0 AND balance > 0;
