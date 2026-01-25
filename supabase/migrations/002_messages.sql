-- MESSAGES TABLE for Contact Form
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTES TABLE for ticket-style comments on messages
CREATE TABLE IF NOT EXISTS message_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for contact form)
CREATE POLICY "Allow anonymous insert messages" ON messages
    FOR INSERT TO anon
    WITH CHECK (true);

-- Policy: Allow authenticated users to read all messages
CREATE POLICY "Allow authenticated read messages" ON messages
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Allow authenticated users to update messages
CREATE POLICY "Allow authenticated update messages" ON messages
    FOR UPDATE TO authenticated
    USING (true);

-- Policy: Allow authenticated users full access to notes
CREATE POLICY "Allow authenticated all notes" ON message_notes
    FOR ALL TO authenticated
    USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_message_notes_message_id ON message_notes(message_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
