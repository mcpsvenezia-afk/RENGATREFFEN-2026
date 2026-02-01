-- 🧬 SKILL: BLITZ_STACK_PLUGIN_RULES_v1
-- Migration: Add pilot_code to track A/B pilots in race_logs and live_tracking
-- Created on: 01/02/2026

ALTER TABLE race_logs ADD COLUMN IF NOT EXISTS pilot_code TEXT;
ALTER TABLE live_tracking ADD COLUMN IF NOT EXISTS pilot_code TEXT;

-- Comments for documentation
COMMENT ON COLUMN race_logs.pilot_code IS 'Indicates if the photo was taken by Captain (A) or Partner (B)';
COMMENT ON COLUMN live_tracking.pilot_code IS 'Indicates which pilot (A or B) is sending the current GPS position';
