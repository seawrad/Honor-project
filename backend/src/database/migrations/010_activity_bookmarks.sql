-- Activity bookmarks / saved activities
-- Migration: 010_activity_bookmarks.sql

CREATE TABLE IF NOT EXISTS activity_bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_bookmarks_user ON activity_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_bookmarks_activity ON activity_bookmarks(activity_id);
