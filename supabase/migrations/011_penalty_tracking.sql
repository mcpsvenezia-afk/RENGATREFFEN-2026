-- 🧬 MIGRATION: Penalty Tracking v1.0
-- Add separation seconds to registrations to track penalties

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS separation_seconds INTEGER DEFAULT 0;

-- 🧬 RPC: Increment separation seconds safely
CREATE OR REPLACE FUNCTION increment_separation_seconds(team_id UUID, seconds INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE registrations
    SET separation_seconds = separation_seconds + seconds
    WHERE id = team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
