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
    const isDevMode = typeof window !== 'undefined' && localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';

    if (process.env.NODE_ENV === 'development' || isDevMode) {
        console.group('🧬 [DEBUG] DB_SUBMIT_REGISTRATION');
        console.log('Payload:', data);
        console.log('Dev Mode Active:', isDevMode);
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
        // 1. Fetch Dynamic Settings
        let maxMoto = 30;
        let max4x4 = 10;
        let isOpen = true;

        const { data: settsData } = await supabase.from('settings').select('value').eq('id', 'event_params').single();
        if (settsData && settsData.value) {
            maxMoto = settsData.value.max_moto ?? 30;
            max4x4 = settsData.value.max_4x4 ?? 10;
            isOpen = settsData.value.is_open ?? true;
        }

        if (!isOpen && !isDevMode) {
            return { success: false, error: "Le iscrizioni online sono attualmente chiuse." };
        }

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
        if (isDevMode) {
            console.log('[DB] DEV MODE: Bypassing overbooking rules');
        } else {
            if (data.formula_partecipazione !== '4x4' && countMoto >= maxMoto) {
                stato_iscrizione = 'Lista_Attesa';
            } else if (data.formula_partecipazione === '4x4' && count4x4 >= max4x4) {
                stato_iscrizione = 'Lista_Attesa';
            }
        }

        // Single Player Check (Solo per Moto)
        if (data.formula_partecipazione !== '4x4' && (!data.secondo_nome || data.secondo_nome.trim() === '')) {
            // Se non è già in lista attesa, la mettiamo in valutazione
            if (stato_iscrizione !== 'Lista_Attesa') {
                stato_iscrizione = 'In_Valutazione';
            }
        }

        // --- LOGICA ANTI-DUPLICATI (Safety Check) v7.2.7 ---
        let is_duplicate = false;
        if (isDevMode) {
            console.log('[DB] DEV MODE: Bypassing duplicate check');
        } else {
            const { data: duplicates, error: errDup } = await supabase
                .from('registrations')
                .select('id')
                .or(`and(nome.eq."${data.nome}",cognome.eq."${data.cognome}"),email.eq."${data.email}",telefono.eq."${data.telefono}"`)
                .limit(1);

            is_duplicate = (duplicates && duplicates.length > 0);
            if (errDup) console.error('[DB] Duplicate Check Error:', errDup);
        }

        // Arricchimento dati per insert
        const finalData = {
            ...data,
            stato_iscrizione: stato_iscrizione,
            is_duplicate: is_duplicate,
            admin_notes: is_duplicate ? '⚠️ ATTENZIONE: Possibile duplicato rilevato automaticamente.' : null
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
