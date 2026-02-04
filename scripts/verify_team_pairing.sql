-- ============================================
-- VERIFICA STATO TEAM PAIRING
-- ============================================

-- 📊 STEP 1: Verifica se il campo team_id esiste e contiene dati
SELECT 
    team_status,
    COUNT(*) as count,
    COUNT(DISTINCT team_id) FILTER (WHERE team_id IS NOT NULL) as unique_teams
FROM registrations
GROUP BY team_status
ORDER BY team_status;

-- 📊 STEP 2: Mostra i team accoppiati (PAIRED)
SELECT 
    team_id,
    team_name,
    nome,
    cognome,
    telefono,
    secondo_cellulare,
    team_status,
    team_paired_at
FROM registrations
WHERE team_status = 'PAIRED'
ORDER BY team_id, team_name;

-- 📊 STEP 3: Mostra i piloti singoli (SINGLE)
SELECT 
    id,
    team_name,
    nome,
    cognome,
    telefono,
    secondo_cellulare,
    team_status
FROM registrations
WHERE team_status = 'SINGLE' OR team_status IS NULL
ORDER BY team_name;
