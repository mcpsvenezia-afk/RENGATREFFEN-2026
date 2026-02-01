-- 🧬 SKILL: BLITZ_STACK_PLUGIN_RULES_v1
-- Migration: Ensure public access for Race App and login checks
-- Created on: 01/02/2026

-- Enable RLS on registrations if not already
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow public read access (necessary for Race App login)
-- Note: We only allow reading if bib_number is set (standard teams)
DROP POLICY IF EXISTS "Allow public read for Race App" ON registrations;
CREATE POLICY "Allow public read for Race App" ON registrations 
FOR SELECT USING (bib_number IS NOT NULL);

-- Allow public insert to race_logs (for photo uploads)
ALTER TABLE race_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert for Race App" ON race_logs;
CREATE POLICY "Allow public insert for Race App" ON race_logs 
FOR INSERT WITH CHECK (true);

-- Allow public upsert to live_tracking
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public upsert for Race App" ON live_tracking;
CREATE POLICY "Allow public upsert for Race App" ON live_tracking 
FOR ALL USING (true);
