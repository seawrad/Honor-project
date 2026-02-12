-- Run Memory Cards (Lenticular-style post-run summary)
-- Captures: AI image, group photo, runner messages, weather, run info

CREATE TABLE IF NOT EXISTS run_memory_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  run_date DATE NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 1,
  total_distance DECIMAL(6, 2) NOT NULL,
  average_speed DECIMAL(5, 2) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  weather_temp INTEGER,
  weather_desc VARCHAR(100),
  news_headline TEXT,
  ai_image_url TEXT,
  group_photo_url TEXT,
  messages JSONB DEFAULT '[]',
  route_summary JSONB
);

CREATE INDEX IF NOT EXISTS idx_run_memory_cards_activity ON run_memory_cards(activity_id);
CREATE INDEX IF NOT EXISTS idx_run_memory_cards_created_by ON run_memory_cards(created_by);
