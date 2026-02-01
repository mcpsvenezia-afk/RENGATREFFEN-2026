-- 1. Fix Missing Settings Row (Causes 406 Error)
INSERT INTO settings (id, value)
VALUES (
    'app_config',
    '{
        "enable_proximity_audio": true,
        "enable_photo_distance_check": true,
        "enable_penalty_tracking": true,
        "enable_live_tracking": true,
        "enable_offline_sync": true,
        "force_dev_mode_features": false
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Fix FK Relationship for missing join (Causes 400 Error)
-- Ensure foreign keys exist properly for PostgREST resource embedding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_race_logs_registration'
    ) THEN
        ALTER TABLE race_logs 
        ADD CONSTRAINT fk_race_logs_registration 
        FOREIGN KEY (registration_id) 
        REFERENCES registrations(id) 
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_live_tracking_registration'
    ) THEN
        ALTER TABLE live_tracking 
        ADD CONSTRAINT fk_live_tracking_registration 
        FOREIGN KEY (registration_id) 
        REFERENCES registrations(id) 
        ON DELETE CASCADE;
    END IF;
END $$;
