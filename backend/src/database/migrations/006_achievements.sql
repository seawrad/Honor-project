-- Achievements / Badges system
-- Migration: 006_achievements.sql

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_zh VARCHAR(100) NOT NULL,
  description TEXT,
  description_zh TEXT,
  icon VARCHAR(20) NOT NULL DEFAULT '🏅',
  condition_type VARCHAR(50) NOT NULL,
  condition_value INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Seed default achievements
INSERT INTO achievements (code, name, name_zh, description, description_zh, icon, condition_type, condition_value, sort_order)
VALUES
  ('first_run', 'First Run', '初跑者', 'Complete your first group run', '完成第一次團體跑', '🎯', 'total_runs', 1, 1),
  ('run_5', '5 Runs', '五跑達人', 'Complete 5 group runs', '完成 5 次團體跑', '🏃', 'total_runs', 5, 2),
  ('run_10', '10 Runs', '十跑健將', 'Complete 10 group runs', '完成 10 次團體跑', '💪', 'total_runs', 10, 3),
  ('run_25', '25 Runs', '跑團常客', 'Complete 25 group runs', '完成 25 次團體跑', '⭐', 'total_runs', 25, 4),
  ('run_50', '50 Runs', '半百跑者', 'Complete 50 group runs', '完成 50 次團體跑', '🌟', 'total_runs', 50, 5),
  ('first_5k', 'First 5K', '初嘗五公里', 'Complete a 5km run', '完成一次 5 公里跑', '📏', 'single_run_km', 5, 10),
  ('first_10k', 'First 10K', '十公里解鎖', 'Complete a 10km run', '完成一次 10 公里跑', '🏆', 'single_run_km', 10, 11),
  ('first_half', 'Half Marathon', '半馬成就', 'Complete a 21km run', '完成一次 21 公里跑', '🎖️', 'single_run_km', 21, 12),
  ('total_50k', '50K Total', '累積五十公里', 'Run 50km total', '累積跑步 50 公里', '🛤️', 'total_distance_km', 50, 20),
  ('total_100k', '100K Total', '百公里達成', 'Run 100km total', '累積跑步 100 公里', '🦁', 'total_distance_km', 100, 21),
  ('total_500k', '500K Total', '五百公里大師', 'Run 500km total', '累積跑步 500 公里', '👑', 'total_distance_km', 500, 22),
  ('week_streak_3', '3-Week Streak', '連續三週', 'Run in 3 consecutive weeks', '連續三週都有跑步', '🔥', 'weekly_streak', 3, 30),
  ('week_streak_7', '7-Week Streak', '連續七週', 'Run in 7 consecutive weeks', '連續七週都有跑步', '🔥', 'weekly_streak', 7, 31),
  ('social_5', 'Social Runner', '社交跑者', 'Join 5 different activities', '參加 5 場不同活動', '👥', 'unique_activities', 5, 40),
  ('early_bird', 'Early Bird', '晨跑者', 'Complete a run before 8am', '在早上 8 點前完成跑步', '🌅', 'early_run', 1, 50),
  ('memory_card', 'Memory Keeper', '記憶收藏家', 'Create your first run memory card', '建立第一張跑步記憶卡', '🃏', 'memory_cards', 1, 60)
ON CONFLICT (code) DO NOTHING;
