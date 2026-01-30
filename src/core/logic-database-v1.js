import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './logic-email-v1.js';

/**
 * 🧬 CORE: logic-database-v1.js
 * Sistema nervoso per la gestione delle persistenza dati su Supabase.
 * Versione: 1.1.0 (Integrazione Email)
 */

// Inizializzazione client tramite variabili d'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        // --- LOGICA DI CONTROLLO OVERBOOKING (DNA Check) v7.2 ---
        let stato_iscrizione = 'Confermata';

        // Conteggio registrazioni esistenti per categoria
        // Moto (Caccia + Discovery)
        const { count: countMoto, error: errMoto } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .or('formula_partecipazione.eq.Caccia_MCPS,formula_partecipazione.eq.Caccia_NON_MCPS,formula_partecipazione.eq.Discovery');

        // Auto 4x4
        const { count: count4x4, error: err4x4 } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('formula_partecipazione', '4x4');

        if (errMoto || err4x4) {
            console.error('[DB] Count Error:', errMoto || err4x4);
        }

        // Regole Overbooking
        if (data.formula_partecipazione !== '4x4' && countMoto >= 30) {
            stato_iscrizione = 'Lista_Attesa';
        } else if (data.formula_partecipazione === '4x4' && count4x4 >= 10) {
            stato_iscrizione = 'Lista_Attesa';
        }

        // Single Player Check (Solo per Moto)
        if (data.formula_partecipazione !== '4x4' && (!data.secondo_nome || data.secondo_nome.trim() === '')) {
            // Se non è già in lista attesa, la mettiamo in valutazione
            if (stato_iscrizione !== 'Lista_Attesa') {
                stato_iscrizione = 'In_Valutazione';
            }
        }

        // Arricchimento dati per insert
        const finalData = {
            ...data,
            stato_iscrizione: stato_iscrizione
        };

        // 2. Esecuzione Insert nella tabella 'registrations'
        const { error } = await supabase
            .from('registrations')
            .insert([finalData]);

        // 3. Gestione Errori (es. constraint violati o connection error)
        if (error) {
            console.error('[DB] Insert Error:', error);

            // Mapping errori comuni
            if (error.code === '23505') {
                return { success: false, error: 'Questa email risulta già iscritta al Renga Treffen.' };
            }

            return { success: false, error: error.message };
        }

        // 4. INTEGRAZIONE EMAIL: Notifica l'utente con il nuovo payload che include lo stato
        sendWelcomeEmail(finalData).then(result => {
            if (!result.success) {
                console.warn('[DB->EMAIL] Notifica fallita:', result.error);
            } else {
                console.log('[DB->EMAIL] Notifica inviata con successo.');
            }
        });

        return { success: true, stato: stato_iscrizione };

    } catch (err) {
        console.error('[DB] Unexpected Error:', err);
        return { success: false, error: 'Errore critico durante il salvataggio dei dati.' };
    }
}
