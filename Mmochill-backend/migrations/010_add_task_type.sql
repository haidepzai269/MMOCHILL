-- Migration to add type column to tasks table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='type') THEN
        ALTER TABLE tasks ADD COLUMN type VARCHAR(50) DEFAULT 'surf';
    END IF;
END $$;
