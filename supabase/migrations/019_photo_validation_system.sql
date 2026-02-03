-- 🧬 MIGRATION: Race Photo Validation v1.0
-- Created on: 2026-02-03
-- Objective: Support manual validation of race photos and status tracking.

-- 1. Add validation status to race_logs
ALTER TABLE race_logs ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'PENDING';

-- 2. Add comments for clarity
COMMENT ON COLUMN race_logs.validation_status IS 'PENDING, VALID, REJECTED, SALTATA';

-- 3. Pre-populate existing logs as VALID if they exist (to avoid breaking current view)
UPDATE race_logs SET validation_status = 'VALID' WHERE validation_status = 'PENDING' AND photo_url IS NOT NULL;
