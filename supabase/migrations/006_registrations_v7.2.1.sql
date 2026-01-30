-- 🧬 SKILL: BLITZ_STACK_PLUGIN_RULES_v1
-- Migration: Add name fields for passengers and guests v7.2.1
-- Created on: 30/01/2026

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS nomi_passeggeri_4x4 TEXT,
ADD COLUMN IF NOT EXISTS nomi_ospiti_pranzo TEXT;

COMMENT ON COLUMN registrations.nomi_passeggeri_4x4 IS 'Comma separated names of 4x4 passengers';
COMMENT ON COLUMN registrations.nomi_ospiti_pranzo IS 'Comma separated names of lunch guests';
