-- 1. SBLOCCO STRUTTURALE (Foreign Keys)
-- Crea le connessioni mancanti che causano errori di invio
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_race_logs_registration') THEN
        ALTER TABLE race_logs ADD CONSTRAINT fk_race_logs_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_live_tracking_registration') THEN
        ALTER TABLE live_tracking ADD CONSTRAINT fk_live_tracking_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. FORZA LIVE TRACKING "ON" (Mantenendo gli altri OFF)
-- Questo accende solo il GPS, lasciando spenti allarmi e penalità come volevi.
INSERT INTO settings (id, value)
VALUES ('app_config', '{"enable_live_tracking": true, "enable_proximity_audio": false, "enable_photo_distance_check": false}'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET value = settings.value || '{"enable_live_tracking": true}'::jsonb;

-- 3. SBLOCCO PERMESSI (RLS Policies)
-- Fondamentale: permette ai telefoni (utenti anonimi) di inviare la posizione e le foto.
ALTER TABLE race_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;

-- Policy per race_logs (Foto)
DROP POLICY IF EXISTS "Anon Insert Logs" ON race_logs;
CREATE POLICY "Anon Insert Logs" ON race_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anon Select Logs" ON race_logs;
CREATE POLICY "Anon Select Logs" ON race_logs FOR SELECT USING (true);

-- Policy per live_tracking (Radar)
DROP POLICY IF EXISTS "Anon Insert Tracking" ON live_tracking;
CREATE POLICY "Anon Insert Tracking" ON live_tracking FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anon Update Tracking" ON live_tracking;
CREATE POLICY "Anon Update Tracking" ON live_tracking FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anon Select Tracking" ON live_tracking;
CREATE POLICY "Anon Select Tracking" ON live_tracking FOR SELECT USING (true);
