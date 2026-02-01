-- 🧬 DNA-DEEP-INSPECT: Database Verification Query
-- Purpose: Verify exact storage format of bib_number in registrations table
-- Execute this in Supabase SQL Editor

-- 1. Check first 10 teams with bib_number assigned
SELECT 
    id,
    bib_number,
    team_name,
    stato_iscrizione,
    created_at
FROM registrations 
WHERE bib_number IS NOT NULL 
    AND bib_number != ''
ORDER BY bib_number
LIMIT 10;

-- 2. Check data type and structure
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'registrations' 
    AND column_name IN ('bib_number', 'team_name', 'stato_iscrizione');

-- 3. Check for potential duplicates or malformed entries
SELECT 
    bib_number,
    COUNT(*) as count,
    array_agg(team_name) as teams
FROM registrations 
WHERE bib_number IS NOT NULL
GROUP BY bib_number
HAVING COUNT(*) > 1;

-- 4. Check RLS policies on registrations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'registrations';
