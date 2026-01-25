-- 🧬 SQL: ATTACHMENTS SYSTEM v5.0 (CRM FIX)
-- Esegui questo script nello SQL Editor di Supabase.

-- 1. Tabella Allegati
CREATE TABLE IF NOT EXISTS public.crm_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    field_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Permessi (RLS)
ALTER TABLE public.crm_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.crm_attachments FOR ALL USING (true) WITH CHECK (true);

-- 3. Storage Bucket
-- NOTA: Devi comunque creare manualmente il bucket 'attachments' nella sezione Storage di Supabase e impostarlo come PUBLIC.
