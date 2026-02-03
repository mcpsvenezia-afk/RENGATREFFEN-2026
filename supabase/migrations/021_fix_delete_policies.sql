-- 🧬 SKILL: BLITZ_STACK_ADMIN_v1
-- Migration: Enable DELETE on race_logs for admin resetting
-- Created on: 03/02/2026

DROP POLICY IF EXISTS "Admin Delete Logs" ON race_logs;
CREATE POLICY "Admin Delete Logs" ON race_logs FOR DELETE USING (true);

-- Ensure registrations also have admin/anon delete if needed (for crm cleanup)
DROP POLICY IF EXISTS "Admin Delete Registrations" ON registrations;
CREATE POLICY "Admin Delete Registrations" ON registrations FOR DELETE USING (true);
