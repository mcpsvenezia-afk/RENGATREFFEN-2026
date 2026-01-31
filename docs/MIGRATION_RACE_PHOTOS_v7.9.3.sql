-- 1. Estensione Tabella Logs per supportare le immagini
ALTER TABLE race_logs ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Istruzioni per Mario (Storage): 
-- Devi creare un Bucket chiamato 'race_photos' nel pannello Storage di Supabase
-- Imposta il Bucket come 'Public' e aggiungi queste Policy di sicurezza:
-- Policy 1: 'Permetti upload a tutti' (INSERT)
-- Policy 2: 'Permetti lettura a tutti' (SELECT)
