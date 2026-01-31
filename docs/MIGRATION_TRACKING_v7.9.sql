-- 1. Tabella per il Tracking Real-Time (Ambrogio Eye)
CREATE TABLE IF NOT EXISTS live_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Permessi pubblici per live_tracking
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public upsert tracking" ON live_tracking;
CREATE POLICY "Allow public upsert tracking" ON live_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select tracking" ON live_tracking FOR SELECT USING (true);
CREATE POLICY "Allow public update tracking" ON live_tracking FOR UPDATE USING (true);
