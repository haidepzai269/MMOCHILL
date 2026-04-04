-- Migration to increase bypass_token column length
ALTER TABLE user_task_claims ALTER COLUMN bypass_token TYPE TEXT;
