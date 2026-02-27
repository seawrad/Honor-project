-- Allow solo runs (routes and memory cards without activity)
-- Routes: activity_id can be NULL for solo runs
ALTER TABLE routes ALTER COLUMN activity_id DROP NOT NULL;

-- Run memory cards: activity_id can be NULL for solo runs
ALTER TABLE run_memory_cards ALTER COLUMN activity_id DROP NOT NULL;
