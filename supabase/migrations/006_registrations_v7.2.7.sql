-- 🧬 SKILL: BLITZ_STACK_PLUGIN_RULES_v1
-- Migration: Add duplicate flag and notes to registrations table v7.2.7
-- Created on: 30/01/2026

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN registrations.is_duplicate IS 'Flag per segnalare iscrizioni potenzialmente doppie (Nome+Cognome, Email o Cellulare)';
COMMENT ON COLUMN registrations.admin_notes IS 'Note interne per gli amministratori (es. verifiche manuali)';
