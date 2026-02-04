// Script per normalizzare i numeri di cellulare esistenti nel database
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leggi .env.local manualmente
const envPath = join(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Errore: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non trovati in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function normalizePhoneNumbers() {
    console.log('🔄 Inizio normalizzazione numeri di cellulare...\n');

    try {
        // 1. Fetch tutti i record con numeri di telefono
        const { data: registrations, error: fetchError } = await supabase
            .from('registrations')
            .select('id, team_name, telefono, secondo_cellulare')
            .or('telefono.not.is.null,secondo_cellulare.not.is.null');

        if (fetchError) {
            console.error('❌ Errore nel fetch dei dati:', fetchError);
            return;
        }

        console.log(`📊 Trovati ${registrations.length} record da processare\n`);

        let updatedCount = 0;

        // 2. Normalizza ogni record
        for (const reg of registrations) {
            const updates = {};
            let needsUpdate = false;

            // Normalizza telefono
            if (reg.telefono) {
                let normalized = reg.telefono.replace(/\s+/g, ''); // Rimuovi spazi
                if (normalized && /^[0-9]/.test(normalized)) {
                    normalized = '+39' + normalized; // Aggiungi +39 se inizia con numero
                }
                if (normalized !== reg.telefono) {
                    updates.telefono = normalized;
                    needsUpdate = true;
                    console.log(`📞 ${reg.team_name}: "${reg.telefono}" → "${normalized}"`);
                }
            }

            // Normalizza secondo_cellulare
            if (reg.secondo_cellulare) {
                let normalized = reg.secondo_cellulare.replace(/\s+/g, ''); // Rimuovi spazi
                if (normalized && /^[0-9]/.test(normalized)) {
                    normalized = '+39' + normalized; // Aggiungi +39 se inizia con numero
                }
                if (normalized !== reg.secondo_cellulare) {
                    updates.secondo_cellulare = normalized;
                    needsUpdate = true;
                    console.log(`📱 ${reg.team_name} (Partner): "${reg.secondo_cellulare}" → "${normalized}"`);
                }
            }

            // 3. Aggiorna il record se necessario
            if (needsUpdate) {
                const { error: updateError } = await supabase
                    .from('registrations')
                    .update(updates)
                    .eq('id', reg.id);

                if (updateError) {
                    console.error(`❌ Errore aggiornamento ${reg.team_name}:`, updateError);
                } else {
                    updatedCount++;
                }
            }
        }

        console.log(`\n✅ Normalizzazione completata! ${updatedCount} record aggiornati su ${registrations.length} totali.`);

    } catch (error) {
        console.error('❌ Errore durante la normalizzazione:', error);
    }
}

normalizePhoneNumbers();
