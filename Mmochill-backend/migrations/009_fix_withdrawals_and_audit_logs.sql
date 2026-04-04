-- Migration: 009_fix_withdrawals_and_audit_logs.sql

-- 1. Add updated_at column to withdrawals table
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Rename admin_audit_logs to audit_logs (if audit_logs doesn't exist yet)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_audit_logs') 
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE admin_audit_logs RENAME TO audit_logs;
    END IF;
END $$;
