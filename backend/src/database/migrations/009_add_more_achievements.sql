-- Add more achievements
-- Migration: 009_add_more_achievements.sql

INSERT INTO achievements (code, name, name_zh, description, description_zh, icon, condition_type, condition_value, sort_order)
VALUES
  ('run_3', '3 Runs', '三跑入門', 'Complete 3 group runs', '完成 3 次團體跑', '🏅', 'total_runs', 3, 2),
  ('run_100', '100 Runs', '百跑傳奇', 'Complete 100 group runs', '完成 100 次團體跑', '💎', 'total_runs', 100, 6),
  ('first_marathon', 'Marathon', '全馬成就', 'Complete a 42km run', '完成一次 42 公里全馬', '🏅', 'single_run_km', 42, 13),
  ('total_250k', '250K Total', '累積兩百五十公里', 'Run 250km total', '累積跑步 250 公里', '🛤️', 'total_distance_km', 250, 23),
  ('total_1000k', '1000K Total', '千公里大師', 'Run 1000km total', '累積跑步 1000 公里', '👑', 'total_distance_km', 1000, 24),
  ('memory_card_5', '5 Memory Cards', '五張記憶卡', 'Create 5 run memory cards', '建立 5 張跑步記憶卡', '🃏', 'memory_cards', 5, 61),
  ('memory_card_10', '10 Memory Cards', '記憶卡收藏家', 'Create 10 run memory cards', '建立 10 張跑步記憶卡', '🃏', 'memory_cards', 10, 62),
  ('social_10', 'Super Social', '超級社交跑者', 'Join 10 different activities', '參加 10 場不同活動', '👥', 'unique_activities', 10, 41),
  ('week_streak_4', '4-Week Streak', '連續四週', 'Run in 4 consecutive weeks', '連續四週都有跑步', '🔥', 'weekly_streak', 4, 31),
  ('first_solo_run', 'Solo Runner', '獨跑初體驗', 'Complete your first solo run', '完成第一次獨跑', '🏃‍♂️', 'solo_runs', 1, 70)
ON CONFLICT (code) DO NOTHING;
