import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './logic-email-v1.js';

/**
 * 🧬 CORE: logic-database-v1.js
 * Sistema nervoso per la gestione delle persistenza dati su Supabase.
 * Versione: 1.1.0 (Integrazione Email)
 */

// Inizializzazione client tramite variabili d'ambiente (per USER_REQUEST)
// NOTA: In ambiente Vite si userebbe import.meta.env, ma procediamo come richiesto.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[DB] Errore: Credenziali Supabase mancanti in process.env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Invia i dati di iscrizione al database e notifica l'utente via email.
 * @param {Object} data - I dati raccolti dal form
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitRegistration(data) {
    // Log di debug attivo solo in modalità sviluppo
    if (process.env.NODE_ENV === 'development') {
        console.group('🧬 [DEBUG] DB_SUBMIT_REGISTRATION');
        console.log('Payload:', data);
        console.groupEnd();
    }

    // 1. Validazione Campi Obbligatori
    if (!data.email || data.email.trim() === '') {
        return { success: false, error: "L'email è un campo obbligatorio." };
    }
    if (!data.nome || data.nome.trim() === '') {
        return { success: false, error: "Il nome è un campo obbligatorio." };
    }

    try {
        // 2. Esecuzione Insert nella tabella 'registrations'
        const { error } = await supabase
            .from('registrations')
            .insert([data]);

        // 3. Gestione Errori (es. constraint violati o connection error)
        if (error) {
            console.error('[DB] Insert Error:', error);

            // Mapping errori comuni
            if (error.code === '23505') {
                return { success: false, error: 'Questa email risulta già iscritta al Renga Treffen.' };
            }

            return { success: false, error: error.message };
        }

        // 4. INTEGRAZIONE EMAIL: Notifica l'utente
        // Non blocchiamo la risposta della registrazione se l'email fallisce, ma logghiamo l'esito.
        sendWelcomeEmail(data).then(result => {
            if (!result.success) {
                console.warn('[DB->EMAIL] Notifica fallita:', result.error);
            } else {
                console.log('[DB->EMAIL] Notifica inviata con successo.');
            }
        });

        return { success: true };

    } catch (err) {
        console.error('[DB] Unexpected Error:', err);
        return { success: false, error: 'Errore critico durante il salvataggio dei dati.' };
    }
}
