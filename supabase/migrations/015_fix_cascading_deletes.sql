-- 🧬 MIGRATION: Fix Cascading Deletes for Registrations
-- Purpose: Ensures all related data is deleted when a registration is removed (Admin Dashboard Fix)
-- Created on: 02/02/2026

-- 1. FIX: tracking_debug_logs (The main blocker)
ALTER TABLE tracking_debug_logs 
DROP CONSTRAINT IF EXISTS tracking_debug_logs_registration_id_fkey;

ALTER TABLE tracking_debug_logs
ADD CONSTRAINT tracking_debug_logs_registration_id_fkey 
FOREIGN KEY (registration_id) 
REFERENCES registrations(id) 
ON DELETE CASCADE;

-- 2. ADD POLICIES: Allow Admin to manage debug logs
DROP POLICY IF EXISTS "Allow Delete for Admin" ON tracking_debug_logs;
CREATE POLICY "Allow Delete for Admin" ON tracking_debug_logs
    FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow All for Admin" ON tracking_debug_logs;
CREATE POLICY "Allow All for Admin" ON tracking_debug_logs
    FOR ALL USING (true);

-- 3. VERIFY: live_tracking (Ensuring cascade is active)
ALTER TABLE live_tracking 
DROP CONSTRAINT IF EXISTS fk_live_tracking_registration;

ALTER TABLE live_tracking
ADD CONSTRAINT fk_live_tracking_registration 
FOREIGN KEY (registration_id) 
REFERENCES registrations(id) 
ON DELETE CASCADE;

-- 4. VERIFY: race_logs (Ensuring cascade is active)
ALTER TABLE race_logs 
DROP CONSTRAINT IF EXISTS fk_race_logs_registration;

ALTER TABLE race_logs
ADD CONSTRAINT fk_race_logs_registration 
FOREIGN KEY (registration_id) 
REFERENCES registrations(id) 
ON DELETE CASCADE;

-- 5. VERIFY: registration_notes (Ensuring cascade is active)
ALTER TABLE registration_notes 
DROP CONSTRAINT IF EXISTS registration_notes_registration_id_fkey;

ALTER TABLE registration_notes
ADD CONSTRAINT registration_notes_registration_id_fkey 
FOREIGN KEY (registration_id) 
REFERENCES registrations(id) 
ON DELETE CASCADE;
