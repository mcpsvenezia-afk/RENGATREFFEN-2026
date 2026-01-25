-- 🧬 SKILL: BLITZ_STACK_PLUGIN_RULES_v1
-- Migration: Expansion of registrations table for Renga Treffen 2026 v1.1.0
-- Created on: 25/01/2026

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS is_mcps_member TEXT,
ADD COLUMN IF NOT EXISTS mcps_delegation TEXT,
ADD COLUMN IF NOT EXISTS team_name TEXT,
ADD COLUMN IF NOT EXISTS moto_details TEXT,
ADD COLUMN IF NOT EXISTS team_role TEXT,
ADD COLUMN IF NOT EXISTS codice_fiscale TEXT,
ADD COLUMN IF NOT EXISTS citta_nascita TEXT,
ADD COLUMN IF NOT EXISTS citta_residenza TEXT,
ADD COLUMN IF NOT EXISTS via_residenza TEXT,
ADD COLUMN IF NOT EXISTS civico_residenza TEXT,
ADD COLUMN IF NOT EXISTS cap_residenza TEXT,
ADD COLUMN IF NOT EXISTS secondo_cognome TEXT,
ADD COLUMN IF NOT EXISTS secondo_nome TEXT,
ADD COLUMN IF NOT EXISTS secondo_cellulare TEXT,
ADD COLUMN IF NOT EXISTS has_roadbook_skill TEXT,
ADD COLUMN IF NOT EXISTS understand_treasure_hunt TEXT,
ADD COLUMN IF NOT EXISTS understand_knobby_tires TEXT,
ADD COLUMN IF NOT EXISTS understand_team_of_2 TEXT,
ADD COLUMN IF NOT EXISTS understand_donation_no_refund TEXT,
ADD COLUMN IF NOT EXISTS understand_rain_or_shine TEXT,
ADD COLUMN IF NOT EXISTS authorize_media TEXT,
ADD COLUMN IF NOT EXISTS authorize_pilot_profile TEXT,
ADD COLUMN IF NOT EXISTS pilot_photo_url TEXT,
ADD COLUMN IF NOT EXISTS pilot_bio TEXT,
ADD COLUMN IF NOT EXISTS is_fango_tours_member TEXT,
ADD COLUMN IF NOT EXISTS request_fango_tours_membership TEXT,
ADD COLUMN IF NOT EXISTS accept_fango_insurance TEXT,
ADD COLUMN IF NOT EXISTS food_preferences TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_info TEXT,
ADD COLUMN IF NOT EXISTS accept_regulation TEXT;

-- Policy Update (if needed)
-- ALTER POLICY "Enable insert for all" ON registrations FOR INSERT WITH CHECK (true);
