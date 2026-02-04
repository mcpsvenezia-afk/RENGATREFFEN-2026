-- Migration: Normalizzazione numeri di cellulare esistenti
-- Data: 2026-02-04
-- Scopo: Aggiungere +39 e rimuovere spazi dai numeri già presenti

-- 🛡️ NORMALIZZAZIONE CAMPO 'telefono' (Pilota principale)
UPDATE registrations
SET telefono = CASE
    -- Rimuovi tutti gli spazi
    WHEN telefono IS NOT NULL THEN REPLACE(telefono, ' ', '')
    ELSE telefono
END;

UPDATE registrations
SET telefono = CASE
    -- Aggiungi +39 se inizia con un numero (non con +)
    WHEN telefono IS NOT NULL 
         AND telefono != '' 
         AND telefono !~ '^\+' 
         AND telefono ~ '^[0-9]' 
    THEN '+39' || telefono
    ELSE telefono
END;

-- 🛡️ NORMALIZZAZIONE CAMPO 'secondo_cellulare' (Partner)
UPDATE registrations
SET secondo_cellulare = CASE
    -- Rimuovi tutti gli spazi
    WHEN secondo_cellulare IS NOT NULL THEN REPLACE(secondo_cellulare, ' ', '')
    ELSE secondo_cellulare
END;

UPDATE registrations
SET secondo_cellulare = CASE
    -- Aggiungi +39 se inizia con un numero (non con +)
    WHEN secondo_cellulare IS NOT NULL 
         AND secondo_cellulare != '' 
         AND secondo_cellulare !~ '^\+' 
         AND secondo_cellulare ~ '^[0-9]' 
    THEN '+39' || secondo_cellulare
    ELSE secondo_cellulare
END;

-- 📊 VERIFICA: Mostra i primi 10 record aggiornati
SELECT id, team_name, telefono, secondo_cellulare 
FROM registrations 
WHERE telefono IS NOT NULL OR secondo_cellulare IS NOT NULL
LIMIT 10;
