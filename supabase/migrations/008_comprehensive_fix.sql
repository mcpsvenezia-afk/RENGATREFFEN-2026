-- 🧬 SKILL: BLITZ_STACK_CORE_v1
-- Migration: Comprehensive schema fix for Renga Treffen 2026
-- Target: Supabase SQL Editor

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default event parameters
INSERT INTO settings (id, value)
VALUES ('event_params', '{
    "max_moto": 30,
    "max_4x4": 10,
    "is_open": true,
    "iban": "IT55V0760111800001064700964"
}')
ON CONFLICT (id) DO NOTHING;

-- 3. Add missing columns to registrations
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS bib_number TEXT,
ADD COLUMN IF NOT EXISTS departure_time TEXT,
ADD COLUMN IF NOT EXISTS is_paid TEXT DEFAULT 'NO',
ADD COLUMN IF NOT EXISTS score_caccia INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 4. Enable RLS and Policies for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on settings" ON settings;
CREATE POLICY "Allow public read on settings" ON settings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated update on settings" ON settings;
CREATE POLICY "Allow authenticated update on settings" ON settings
FOR ALL TO authenticated USING (true);
