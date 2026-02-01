import { Resend } from 'resend';

/**
 * 🧬 API Function: Notifica Staff di Nuova Iscrizione
 * Trigger: Chiamata da Supabase webhook o client-side dopo INSERT in registrations
 * Destinatario: mcpsvenezia@gmail.com
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userData } = req.body;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Resend API Key non configurata' });
    }

    if (!userData) {
        return res.status(400).json({ error: 'Dati mancanti' });
    }

    const resend = new Resend(apiKey);

    try {
        // Genera HTML ben formattato con TUTTI i dati
        const allFieldsHTML = Object.keys(userData)
            .filter(key => !['id', 'created_at'].includes(key))
            .map(key => {
                let value = userData[key];
                if (value === null || value === undefined || value === '') value = 'N/A';
                if (typeof value === 'object') value = JSON.stringify(value);

                return `<tr>
                    <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: 600; background: #f5f5f5; width: 35%;">${key}</td>
                    <td style="padding: 8px 12px; border: 1px solid #ddd;">${value}</td>
                </tr>`;
            })
            .join('');

        const { data, error } = await resend.emails.send({
            from: 'Renga Treffen Admin <info@rengatreffen.it>',
            to: ['mcpsvenezia@gmail.com'],
            subject: `🚀 NUOVA ISCRIZIONE: ${userData.nome} ${userData.cognome} - Team: ${userData.team_name || 'N/A'}`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; color: #333;">
                    <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #E6007E, #FFCC00); padding: 25px; border-radius: 15px;">
                        <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🏁 NUOVA ISCRIZIONE RICEVUTA</h1>
                        <p style="color: #fff; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">Renga Treffen 2026 - Admin Notification</p>
                    </div>

                    <div style="background: #fff9e6; border-left: 5px solid #FFCC00; padding: 20px; margin-bottom: 25px;">
                        <h2 style="margin: 0; font-size: 20px; color: #333;">
                            <strong>Team:</strong> ${userData.team_name || 'Non specificato'}
                        </h2>
                        <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">
                            <strong>Pilota 1:</strong> ${userData.nome} ${userData.cognome} (${userData.telefono})<br/>
                            ${userData.secondo_nome ? `<strong>Pilota 2:</strong> ${userData.secondo_nome} ${userData.secondo_cognome || ''} (${userData.secondo_cellulare || 'N/A'})<br/>` : ''}
                            <strong>Email:</strong> ${userData.email}<br/>
                            <strong>Formula:</strong> ${userData.formula_partecipazione?.replace(/_/g, ' ') || 'N/A'}<br/>
                            <strong>Importo Dovuto:</strong> € ${userData.importo_dovuto || 0},00<br/>
                            <strong>Stato:</strong> <span style="color: #E6007E; font-weight: bold;">${userData.stato_iscrizione || 'N/A'}</span>
                        </p>
                    </div>

                    <h3 style="margin-top: 30px; font-size: 18px; color: #333; border-bottom: 2px solid #E6007E; padding-bottom: 10px;">📋 DETTAGLI COMPLETI ISCRIZIONE</h3>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                        <thead>
                            <tr>
                                <th style="padding: 12px; background: #E6007E; color: #fff; text-align: left; border: 1px solid #ddd;">Campo</th>
                                <th style="padding: 12px; background: #E6007E; color: #fff; text-align: left; border: 1px solid #ddd;">Valore</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allFieldsHTML}
                        </tbody>
                    </table>

                    <div style="margin-top: 40px; padding: 20px; background: #f8f8f8; border-radius: 15px; text-align: center;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            Questa email è stata generata automaticamente dal sistema Renga Treffen.<br/>
                            <strong>Data Registrazione:</strong> ${new Date(userData.created_at).toLocaleString('it-IT')}
                        </p>
                        <a href="https://rengatreffen-2026-omega.vercel.app/dashboard.html" 
                           style="display: inline-block; margin-top: 15px; padding: 12px 30px; background: linear-gradient(135deg, #E6007E, #FFCC00); color: #fff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">
                            APRI DASHBOARD ADMIN
                        </a>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('[NOTIFY-STAFF] Resend error:', error);
            return res.status(400).json({ error });
        }

        console.log('[NOTIFY-STAFF] Email inviata con successo a mcpsvenezia@gmail.com');
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('[NOTIFY-STAFF] Critical error:', err);
        return res.status(500).json({ error: err.message });
    }
}
