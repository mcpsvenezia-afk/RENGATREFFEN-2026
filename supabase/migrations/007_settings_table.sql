-- 🧬 SKILL: BLITZ_STACK_CORE_v1
-- Migration: Create settings table and default event params
-- Target: Supabase SQL Editor

-- 1. Create the settings table
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

-- 3. Enable RLS (Optional but recommended)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy for Public Read (so the registration form can check if it's open)
CREATE POLICY "Allow public read on settings" ON settings
FOR SELECT USING (true);

-- 5. Create Policy for Admin Service Role (or authenticated users) to update
CREATE POLICY "Allow authenticated update on settings" ON settings
FOR ALL TO authenticated USING (true);
