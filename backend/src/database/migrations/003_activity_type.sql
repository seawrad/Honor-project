-- Add activity type and route-based fields
-- time-based: start point + duration; route-based: start + end points

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS activity_type VARCHAR(20) NOT NULL DEFAULT 'route-based',
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS end_latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS end_longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS end_address VARCHAR(500);

ALTER TABLE activities DROP CONSTRAINT IF EXISTS chk_activity_type;
ALTER TABLE activities ADD CONSTRAINT chk_activity_type CHECK (activity_type IN ('time-based', 'route-based'));
