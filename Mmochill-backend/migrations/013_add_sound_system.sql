ALTER TABLE system_configs 
ADD COLUMN IF NOT EXISTS sound_click_url TEXT DEFAULT 'https://cdn.freesound.org/previews/528/528561_10360410-lq.mp3',
ADD COLUMN IF NOT EXISTS sound_notification_url TEXT DEFAULT 'https://cdn.freesound.org/previews/833/833599_150709-lq.mp3',
ADD COLUMN IF NOT EXISTS sound_success_url TEXT DEFAULT 'https://cdn.freesound.org/previews/717/717771_11611892-lq.mp3';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT TRUE;
