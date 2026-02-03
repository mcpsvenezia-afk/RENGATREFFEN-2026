-- 🧬 MIGRATION 017: Team Auto-Pairing Logic
-- Created: 2026-02-03
-- Purpose: Enable automatic team pairing based on reciprocal phone numbers

-- 1. ADD TEAM FIELDS
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_id UUID;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_status TEXT DEFAULT 'SINGLE' CHECK (team_status IN ('SINGLE', 'PENDING', 'PAIRED'));
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_paired_at TIMESTAMPTZ;

-- 2. CREATE INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_registrations_team_id ON registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_team_status ON registrations(team_status);
CREATE INDEX IF NOT EXISTS idx_registrations_telefono ON registrations(telefono);
CREATE INDEX IF NOT EXISTS idx_registrations_secondo_cellulare ON registrations(secondo_cellulare);

-- 3. CREATE AUTO-PAIRING FUNCTION
CREATE OR REPLACE FUNCTION auto_pair_teams()
RETURNS void AS $$
DECLARE
    pilot_a RECORD;
    pilot_b RECORD;
    new_team_id UUID;
BEGIN
    -- Loop through all unpaired registrations
    FOR pilot_a IN 
        SELECT * FROM registrations 
        WHERE team_status = 'SINGLE' 
        AND secondo_cellulare IS NOT NULL 
        AND secondo_cellulare != ''
    LOOP
        -- Find reciprocal match
        SELECT * INTO pilot_b 
        FROM registrations 
        WHERE id != pilot_a.id
        AND team_status = 'SINGLE'
        AND telefono = pilot_a.secondo_cellulare
        AND secondo_cellulare = pilot_a.telefono;
        
        -- If match found, pair them
        IF FOUND THEN
            new_team_id := gen_random_uuid();
            
            UPDATE registrations 
            SET 
                team_id = new_team_id,
                team_status = 'PAIRED',
                team_paired_at = NOW()
            WHERE id = pilot_a.id;
            
            UPDATE registrations 
            SET 
                team_id = new_team_id,
                team_status = 'PAIRED',
                team_paired_at = NOW()
            WHERE id = pilot_b.id;
            
            RAISE NOTICE 'Paired % with % (team_id: %)', pilot_a.nome, pilot_b.nome, new_team_id;
        END IF;
    END LOOP;
    
    -- Mark partial matches as PENDING
    UPDATE registrations
    SET team_status = 'PENDING'
    WHERE team_status = 'SINGLE'
    AND secondo_cellulare IS NOT NULL
    AND secondo_cellulare != ''
    AND EXISTS (
        SELECT 1 FROM registrations r2
        WHERE r2.telefono = registrations.secondo_cellulare
        AND r2.id != registrations.id
    );
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE TRIGGER TO AUTO-RUN ON INSERT/UPDATE
CREATE OR REPLACE FUNCTION trigger_auto_pair_teams()
RETURNS TRIGGER AS $$
BEGIN
    -- Run pairing logic after insert/update
    PERFORM auto_pair_teams();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_pair_on_registration ON registrations;
CREATE TRIGGER auto_pair_on_registration
    AFTER INSERT OR UPDATE OF secondo_cellulare, telefono ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_pair_teams();

-- 5. INITIAL RUN (pair existing registrations)
SELECT auto_pair_teams();

-- 6. COMMENTS
COMMENT ON COLUMN registrations.team_id IS 'UUID shared by paired team members';
COMMENT ON COLUMN registrations.team_status IS 'SINGLE = no partner, PENDING = partial match, PAIRED = reciprocal match';
COMMENT ON FUNCTION auto_pair_teams() IS 'Automatically pairs pilots based on reciprocal phone numbers';
