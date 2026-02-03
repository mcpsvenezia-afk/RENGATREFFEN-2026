-- 🧬 MIGRATION 016: CRM Reply System & Thread History
-- Created: 2026-02-03
-- Purpose: Enable full chat-style CRM with admin replies and attachment support

-- 1. CREATE CRM REPLIES TABLE
CREATE TABLE IF NOT EXISTS crm_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    content TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    admin_name TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD ATTACHMENTS SUPPORT TO MESSAGES (if not exists)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 3. ENABLE RLS
ALTER TABLE crm_replies ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR CRM REPLIES
DROP POLICY IF EXISTS "Allow authenticated all crm_replies" ON crm_replies;
CREATE POLICY "Allow authenticated all crm_replies" ON crm_replies
    FOR ALL TO authenticated
    USING (true);

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_crm_replies_message_id ON crm_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_crm_replies_registration_id ON crm_replies(registration_id);
CREATE INDEX IF NOT EXISTS idx_crm_replies_user_email ON crm_replies(user_email);
CREATE INDEX IF NOT EXISTS idx_crm_replies_created_at ON crm_replies(created_at DESC);

-- 6. AUTO-UPDATE TRIGGER
DROP TRIGGER IF EXISTS update_crm_replies_updated_at ON crm_replies;
CREATE TRIGGER update_crm_replies_updated_at
    BEFORE UPDATE ON crm_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. COMMENT FOR DOCUMENTATION
COMMENT ON TABLE crm_replies IS 'Stores bidirectional chat history between admin and users for CRM system';
COMMENT ON COLUMN crm_replies.direction IS 'inbound = user message, outbound = admin reply';
