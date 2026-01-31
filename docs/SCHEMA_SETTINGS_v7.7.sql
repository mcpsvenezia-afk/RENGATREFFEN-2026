-- DNA_DATABASE_v7.7 - TABLE: settings
-- Author: Ambrogio (Antigravity)
-- Purpose: Central configuration for Renga Treffen limits and status

CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert central event parameters if they don't exist
-- max_moto: 30, max_4x4: 10, is_open: true
INSERT INTO settings (id, value)
VALUES (
    'event_params',
    '{
        "max_moto": 30,
        "max_4x4": 10,
        "is_open": true,
        "iban": "IT99X0123456789012345678901",
        "beneficiary": "Renga Treffen SSD"
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
