const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBibs() {
    const { data, error } = await supabase
        .from('registrations')
        .select('id, bib_number, team_name, nome, cognome')
        .not('bib_number', 'is', null)
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Registrations with Bibs:', data);
    }
}

checkBibs();
