-- 🧬 SKILL: BLITZ_STACK_PLUGIN_RULES_v1
-- Migration: Expansion of registrations table for Renga Treffen 2026 v7.2.0
-- Created on: 30/01/2026

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS formula_partecipazione TEXT,
ADD COLUMN IF NOT EXISTS importo_dovuto DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS passeggeri_4x4 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pranzo_accompagnatori INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stato_iscrizione TEXT DEFAULT 'Confermata';

COMMENT ON COLUMN registrations.formula_partecipazione IS 'Caccia_MCPS, Caccia_NON_MCPS, Discovery, 4x4';
COMMENT ON COLUMN registrations.stato_iscrizione IS 'Confermata, Lista_Attesa, Annullata';
