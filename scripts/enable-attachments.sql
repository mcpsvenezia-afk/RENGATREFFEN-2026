-- 🧬 SQL: ATTACHMENTS SYSTEM v4.0
-- Esegui questo script nello SQL Editor di Supabase per abilitare gli allegati.

-- 1. Create the attachments table
CREATE TABLE IF NOT EXISTS public.crm_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.crm_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_attachments" ON public.crm_attachments;
CREATE POLICY "public_access_attachments" ON public.crm_attachments FOR ALL USING (true) WITH CHECK (true);

-- 3. Storage Bucket Configuration
-- Ricorda di creare un bucket chiamato 'attachments' su Supabase Storage e impostarlo come PUBBLICO.
