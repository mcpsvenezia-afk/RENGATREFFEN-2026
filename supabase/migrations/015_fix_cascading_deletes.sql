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

-- 2. VERIFY: live_tracking (Ensuring cascade is active)
ALTER TABLE live_tracking 
DROP CONSTRAINT IF EXISTS fk_live_tracking_registration;

ALTER TABLE live_tracking
ADD CONSTRAINT fk_live_tracking_registration 
FOREIGN KEY (registration_id) 
REFERENCES registrations(id) 
ON DELETE CASCADE;

-- 3. VERIFY: race_logs (Ensuring cascade is active)
ALTER TABLE race_logs 
DROP CONSTRAINT IF EXISTS fk_race_logs_registration;

ALTER TABLE race_logs
ADD CONSTRAINT fk_race_logs_registration 
FOREIGN KEY (registration_id) 
REFERENCES registrations(id) 
ON DELETE CASCADE;

-- 4. VERIFY: registration_notes (Ensuring cascade is active)
-- This was already CASCADE but we re-apply for safety
ALTER TABLE registration_notes 
DROP CONSTRAINT IF EXISTS registration_notes_registration_id_fkey;

ALTER TABLE registration_notes
ADD CONSTRAINT registration_notes_registration_id_fkey 
FOREIGN KEY (registration_id) 
REFERENCES registrations(id) 
ON DELETE CASCADE;
