-- Store GPS positions in DB when S3 is unavailable (local development)
-- Migration: 011_route_positions_local.sql

ALTER TABLE routes ADD COLUMN IF NOT EXISTS positions_json JSONB;
