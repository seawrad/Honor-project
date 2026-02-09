-- Add avatar column to users table
-- Stores base64 data URL (data:image/...;base64,...) for profile photo
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
