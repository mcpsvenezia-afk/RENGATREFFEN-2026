-- 🧬 MINI-CRM EXTENSION: MESSAGE NOTES
CREATE TABLE IF NOT EXISTS message_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    admin_name TEXT DEFAULT 'Admin'
);

-- Enable RLS
ALTER TABLE message_notes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admin full access notes" ON message_notes;
CREATE POLICY "Admin full access notes" ON message_notes FOR ALL USING (true);
