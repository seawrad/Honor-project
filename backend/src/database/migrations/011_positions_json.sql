-- Add positions_json for S3 fallback (store positions in DB when S3 unavailable)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS positions_json TEXT;
