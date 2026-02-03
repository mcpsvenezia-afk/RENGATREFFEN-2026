-- 🧬 MIGRATION 018: Team System v10.1
-- Created: 2026-02-03
-- Purpose: Enhanced team pairing logic with state names alignment and email tracking

-- 1. UPDATE SCHEMA
-- Ensure status check includes CONFIRMED (User's preferred term)
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_team_status_check;
ALTER TABLE registrations ADD CONSTRAINT registrations_team_status_check CHECK (team_status IN ('SINGLE', 'PENDING', 'CONFIRMED', 'PAIRED'));

-- Add email tracking column
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_email_sent BOOLEAN DEFAULT FALSE;

-- 2. ENHANCED AUTO-PAIRING FUNCTION
CREATE OR REPLACE FUNCTION auto_pair_teams_v2()
RETURNS void AS $$
DECLARE
    pilot_a RECORD;
    pilot_b RECORD;
    new_team_id UUID;
BEGIN
    -- Reset PENDING if they no longer have a match at all (clean up)
    UPDATE registrations
    SET team_status = 'SINGLE'
    WHERE team_status = 'PENDING'
    AND NOT EXISTS (
        SELECT 1 FROM registrations r2
        WHERE r2.telefono = registrations.secondo_cellulare
        AND r2.id != registrations.id
    );

    -- Loop through all SINGLE or PENDING registrations that HAVE a partner number
    FOR pilot_a IN 
        SELECT * FROM registrations 
        WHERE (team_status = 'SINGLE' OR team_status = 'PENDING')
        AND secondo_cellulare IS NOT NULL 
        AND secondo_cellulare != ''
    LOOP
        -- Find reciprocal match:
        -- B's phone == A's partner phone AND B's partner phone == A's phone
        SELECT * INTO pilot_b 
        FROM registrations 
        WHERE id != pilot_a.id
        AND telefono = pilot_a.secondo_cellulare
        AND secondo_cellulare = pilot_a.telefono;
        
        -- If match found, pair them as CONFIRMED
        IF FOUND THEN
            -- Check if one already has a team_id from a previous PAIRED state (to reuse)
            new_team_id := COALESCE(pilot_a.team_id, pilot_b.team_id, gen_random_uuid());
            
            UPDATE registrations 
            SET 
                team_id = new_team_id,
                team_status = 'CONFIRMED',
                team_paired_at = NOW()
            WHERE id = pilot_a.id OR id = pilot_b.id;
            
            RAISE NOTICE 'Teams CONFIRMED: % and % (team_id: %)', pilot_a.nome, pilot_b.nome, new_team_id;
        ELSE
            -- No reciprocal match, check if it's at least PENDING (A points to B)
            UPDATE registrations
            SET team_status = 'PENDING'
            WHERE id = pilot_a.id
            AND EXISTS (
                SELECT 1 FROM registrations r2
                WHERE r2.telefono = pilot_a.secondo_cellulare
                AND r2.id != pilot_a.id
            );
        END IF;
    END LOOP;
    
    -- Final cleanup: anyone with NO secondo_cellulare is SINGLE
    UPDATE registrations
    SET team_status = 'SINGLE'
    WHERE (secondo_cellulare IS NULL OR secondo_cellulare = '')
    AND team_status != 'CONFIRMED';
END;
$$ LANGUAGE plpgsql;

-- 3. MIGRATE OLD DATA
-- Update existing 'PAIRED' to 'CONFIRMED'
UPDATE registrations SET team_status = 'CONFIRMED' WHERE team_status = 'PAIRED';

-- 4. INITIAL RUN
SELECT auto_pair_teams_v2();

-- 5. UPDATE RPC FOR API COMPATIBILITY
CREATE OR REPLACE FUNCTION auto_pair_teams()
RETURNS void AS $$
BEGIN
    PERFORM auto_pair_teams_v2();
END;
$$ LANGUAGE plpgsql;

-- 6. WEBHOOK AUTOMATION (Optional)
-- Per rendere l'invio email 100% automatico senza premere il tasto in Dashboard:
-- Configurare un Webhook in Supabase:
-- Table: registrations
-- Events: UPDATE
-- Conditions: (old.team_status != 'CONFIRMED' AND new.team_status = 'CONFIRMED')
-- URL: https://[YOUR-VERCEL-URL]/api/crm/send-team-confirmation
