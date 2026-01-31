-- DNA_DATABASE_v7.8 - RACE ENGINE MIGRATION
-- Author: Ambrogio (Antigravity)

-- 1. Extend Registrations for Race Logic
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS card_color TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS target_times JSONB DEFAULT '{}'::jsonb;

-- 2. Create Race Logs Table
CREATE TABLE IF NOT EXISTS race_logs (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT REFERENCES registrations(id) ON DELETE CASCADE,
    photo_number INT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    gps_alt DOUBLE PRECISION,
    client_timestamp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Update Settings Structure
-- We'll do this via the Admin UI, but let's ensure the table exists (it should already)
-- If not, created in v7.7 audit.
