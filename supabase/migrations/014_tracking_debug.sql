-- Create Tracking Debug Logs table for Hardcore Protocol
CREATE TABLE IF NOT EXISTS tracking_debug_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registration_id UUID REFERENCES registrations(id),
    pilot_code TEXT,
    log_type TEXT, -- 'HEARTBEAT', 'GPS_ERROR', 'WAKE_LOCK'
    payload JSONB,
    device_info TEXT
);

-- RLS Policies
ALTER TABLE tracking_debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow Insert for Authenticated Users" ON tracking_debug_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow Read for Admin" ON tracking_debug_logs
    FOR SELECT USING (true);
