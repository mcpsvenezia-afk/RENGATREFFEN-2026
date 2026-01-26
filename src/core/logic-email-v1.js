import { Resend } from 'resend';

/**
 * 🧬 CORE: logic-email-v1.js
 * Sistema di notifiche email tramite Resend API.
 */

/**
 * Invia un'email di benvenuto dopo l'iscrizione.
 * @param {Object} userData - Dati dell'utente (nome, email)
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendWelcomeEmail(userData) {
    // In Vite, le variabili d'ambiente devono iniziare con VITE_ per essere esposte al client
    const apiKey = import.meta.env.VITE_RESEND_API_KEY || (typeof process !== 'undefined' ? process.env.RESEND_API_KEY : null);

    if (!apiKey) {
        console.warn('[EMAIL] Configurazione mancante: VITE_RESEND_API_KEY non trovata. L\'invio email non sarà disponibile.');
        return { success: false, error: 'Configurazione email mancante.' };
    }

    try {
        const resend = new Resend(apiKey);
        const { data, error } = await resend.emails.send({
            from: 'Renga Treffen <onboarding@resend.dev>',
            to: [userData.email],
            subject: 'Conferma Iscrizione - Renga Treffen 2026 🏁',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Ciao ${userData.nome}! 👋</h2>
                    <p style="font-size: 16px; color: #555; line-height: 1.5;">
                        Grazie per esserti iscritto al <strong>Renga Treffen 2026</strong>! 🏁
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.5;">
                        Abbiamo ricevuto correttamente i tuoi dati. Preparati per un'esperienza indimenticabile tra le campagne friulane.
                    </p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <p style="margin: 0; font-size: 14px; color: #777;">
                            Riceverai presto ulteriori dettagli sul programma e sul regolamento finale.
                        </p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        Renga Treffen 2026 - Organizzazione Brussa Team
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('[EMAIL] Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('[EMAIL] Unexpected Error:', err);
        return { success: false, error: err.message };
    }
}
