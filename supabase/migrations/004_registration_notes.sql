-- 🧬 MINI-CRM EXTENSION: REGISTRATION NOTES
CREATE TABLE IF NOT EXISTS registration_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    admin_name TEXT DEFAULT 'Admin'
);

-- Enable RLS
ALTER TABLE registration_notes ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Update with Auth and specific Admin checks if needed)
DROP POLICY IF EXISTS "Admin full access reg_notes" ON registration_notes;
CREATE POLICY "Admin full access reg_notes" ON registration_notes FOR ALL USING (true);
