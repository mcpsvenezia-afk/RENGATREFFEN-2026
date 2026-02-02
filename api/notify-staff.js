import { Resend } from 'resend';
import { generateLiberatoriaHTML } from './templates/liberatoria-template.js';

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

    const LABEL_MAPPING = {
        nome: 'Nome',
        cognome: 'Cognome',
        email: 'Email',
        telefono: 'Telefono Cellulare',
        codice_fiscale: 'Codice Fiscale',
        citta_nascita: 'Città di Nascita',
        via_residenza: 'Via di residenza',
        civico_residenza: 'Civico',
        cap_residenza: 'CAP',
        citta_residenza: 'Città di Residenza',
        is_mcps_member: 'Socio MCPS?',
        mcps_delegation: 'Delegazione MCPS',
        team_name: 'Nome del Team',
        moto_details: 'Dettagli Moto',
        team_role: 'Ruolo nel Team',
        formula_partecipazione: 'Formula di Partecipazione',
        secondo_nome: 'Nome Partner',
        secondo_cognome: 'Cognome Partner',
        secondo_cellulare: 'Cellulare Partner',
        has_roadbook_skill: 'Uso Roadbook Digitale?',
        understand_treasure_hunt: 'Capito Caccia al Tesoro?',
        understand_knobby_tires: 'Capito Ruote Tassellate?',
        understand_team_of_2: 'Capito Team di 2?',
        understand_donation_no_refund: 'Capito No Rimborso?',
        understand_rain_or_shine: 'Capito Anche con Pioggia?',
        authorize_media: 'Autorizza Foto/Video?',
        authorize_pilot_profile: 'Autorizza Profilo Pilota?',
        pilot_bio: 'Bio Pilota',
        is_fango_tours_member: 'Socio Fango Tours?',
        request_fango_tours_membership: 'Richiesta Tessera Fango?',
        accept_fango_insurance: 'Accetta Assicurazione Fango?',
        food_preferences: 'Preferenze Alimentari',
        emergency_contact_phone: 'Telefono Emergenza',
        emergency_contact_info: 'Info Contatto Emergenza',
        accept_regulation: 'Accetta Regolamento?',
        importo_dovuto: 'Totale da Versare (€)',
        stato_iscrizione: 'Stato Iscrizione',
        passeggeri_4x4: 'Numero Passeggeri 4x4',
        nomi_passeggeri_4x4: 'Nomi Passeggeri 4x4',
        pranzo_accompagnatori: 'Numero Ospiti Pranzo',
        nomi_ospiti_pranzo: 'Nomi Ospiti Pranzo'
    };

    try {
        // Genera HTML ben formattato con TUTTI i dati
        const allFieldsHTML = Object.keys(userData)
            .filter(key => !['id', 'created_at', 'pilot_photo'].includes(key))
            .map(key => {
                let value = userData[key];
                const label = LABEL_MAPPING[key] || key;

                if (value === null || value === undefined || value === '') value = 'N/A';
                if (typeof value === 'object') value = JSON.stringify(value);

                return `<tr>
                    <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: 600; background: #f5f5f5; width: 40%; font-size: 13px;">${label}</td>
                    <td style="padding: 8px 12px; border: 1px solid #ddd; font-size: 13px;">${value}</td>
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

                    <h3 style="margin-top: 40px; font-size: 18px; color: #333; border-bottom: 2px solid #FFCC00; padding-bottom: 10px;">📄 LIBERATORIA COMPILATA</h3>
                    <div style="background: #fff9e6; border: 2px solid #FFCC00; padding: 20px; margin-top: 20px; border-radius: 15px;">
                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">
                            Il documento di liberatoria è stato auto-compilato con i dati forniti dall'iscritto. 
                            <strong style="color: #E6007E;">Aprilo, controllalo, stampalo e fallo firmare al pilota.</strong>
                        </p>
                        <a href="data:text/html;charset=utf-8,${encodeURIComponent(generateLiberatoriaHTML(userData))}" 
                           download="LIBERATORIA_${userData.cognome}_${userData.nome}.html"
                           style="display: inline-block; padding: 12px 25px; background: #FFCC00; color: #000; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; margin-right: 10px;">
                            📥 SCARICA LIBERATORIA HTML
                        </a>
                        <p style="margin: 15px 0 0 0; font-size: 12px; color: #999;">
                            Suggerimento: Una volta aperto il file, usa "Stampa" (Ctrl+P) o "Salva come PDF" dal browser.
                        </p>
                    </div>

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
