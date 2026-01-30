import { Resend } from 'resend';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userData } = req.body;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Resend API Key non configurata sul server.' });
    }

    const resend = new Resend(apiKey);

    try {
        let subject = `Registrazione Ricevuta - Renga Treffen ${userData.nome}`;
        let statusMessage = '';
        let statusTitle = 'DOMANDA RICEVUTA';
        let statusColor = '#FFCC00'; // Default Gold

        // Logic for Duplicate (Priority 1)
        if (userData.is_duplicate) {
            statusMessage = `
                <div style="background-color: #fff1f1; border: 2px solid #E6007E; padding: 20px; margin: 25px 0; border-radius: 10px;">
                    <p style="font-size: 15px; color: #E6007E; font-weight: bold; margin: 0; line-height: 1.5; text-align: center; text-transform: uppercase;">
                        ⚠️ ATTENZIONE: RISULTA GIÀ UNA REGISTRAZIONE A TUO NOME. LA TUA RICHIESTA VERRÀ VERIFICATA MANUALMENTE DALLO STAFF.
                    </p>
                </div>
            `;
        }

        if (userData.stato_iscrizione === 'Lista_Attesa') {
            subject = `LISTA D'ATTESA - Renga Treffen ${userData.nome}`;
            statusTitle = "LISTA D'ATTESA";
            statusColor = '#FF4444'; // Red
            statusMessage += `
                <div style="background-color: #fff5f5; border-left: 5px solid #FF4444; padding: 20px; margin: 25px 0;">
                    <p style="font-size: 15px; color: #c53030; font-weight: bold; margin: 0; line-height: 1.5; text-transform: uppercase;">
                        IL NUMERO MASSIMO DI ISCRITTI È STATO RAGGIUNTO. LA TUA ISCRIZIONE È STATA INSERITA IN LISTA D'ATTESA. TI CONTATTEREMO IN CASO DI RINUNCE.
                    </p>
                </div>
            `;
        } else if (userData.stato_iscrizione === 'In_Valutazione') {
            subject = `ISCRIZIONE IN VALUTAZIONE - Renga Treffen ${userData.nome}`;
            statusTitle = 'IN VALUTAZIONE';
            statusColor = '#FFA500'; // Orange
            statusMessage += `
                <div style="background-color: #fffaf0; border-left: 5px solid #FFA500; padding: 20px; margin: 25px 0;">
                    <p style="font-size: 15px; color: #856404; font-weight: bold; margin: 0; line-height: 1.5; text-transform: uppercase;">
                        LA TUA ISCRIZIONE È IN FASE DI VALUTAZIONE POICHÉ AL MOMENTO NON HAI INDICATO UN PARTNER PER LA COPPIA. TI CONTATTEREMO A BREVE.
                    </p>
                </div>
            `;
        } else {
            statusMessage += `
                <div style="background-color: #fff9e6; border-left: 5px solid #FFCC00; padding: 20px; margin: 25px 0;">
                    <p style="font-size: 15px; color: #856404; font-weight: bold; margin: 0; line-height: 1.5; text-transform: uppercase;">
                        A BREVE DOPO LE VERIFICHE DEL CASO RICEVERAI LA CONFERMA DELL'ISCRIZIONE E TUTTE LE INFORMAZIONI NECESSARIE PER PROCEDERE AL PAGAMENTO.
                    </p>
                </div>
            `;
        }

        const { data, error } = await resend.emails.send({
            from: 'Renga Treffen <info@rengatreffen.it>',
            reply_to: 'info@rengatreffen.it',
            to: [userData.email],
            subject: subject,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; color: #333333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #E6007E; margin: 0; font-size: 28px; font-weight: 900;">RENGA TREFFEN 🏁</h1>
                        <p style="color: #666; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">2° Memorial Antonio Armellin</p>
                    </div>

                    <div style="text-align: right; margin-bottom: 10px;">
                        <span style="background: ${statusColor}; color: #000; padding: 5px 15px; border-radius: 50px; font-size: 10px; font-weight: 900; letter-spacing: 1px;">${statusTitle}</span>
                    </div>

                    <h2 style="color: #333; font-size: 22px; border-bottom: 2px solid #FFCC00; padding-bottom: 10px; display: inline-block;">Ciao ${userData.nome}! 👋</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
                        Abbiamo ricevuto correttamente la tua richiesta di iscrizione per il <strong>Renga Treffen 2026</strong>. 
                    </p>

                    ${statusMessage}

                    <div style="background-color: #f8f8f8; border-radius: 15px; padding: 25px; margin: 30px 0; border: 1px solid #eee;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #888; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px;">Riepilogo Dati Trasmessi:</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr><td style="padding: 5px 0; color: #888; width: 40%;">Team:</td><td style="padding: 5px 0; font-weight: bold;">${userData.team_name || 'N/A'}</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Veicolo:</td><td style="padding: 5px 0; font-weight: bold;">${userData.moto_details || 'N/A'}</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Formula:</td><td style="padding: 5px 0; font-weight: bold; color: #FFCC00;">${userData.formula_partecipazione.replace(/_/g, ' ')}</td></tr>
                            
                            <tr><td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #999; text-transform: uppercase;">Dati Pilota 1</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Nome:</td><td style="padding: 5px 0; font-weight: bold;">${userData.nome} ${userData.cognome}</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Telefono:</td><td style="padding: 5px 0; font-weight: bold;">${userData.telefono}</td></tr>
                            
                            ${userData.secondo_nome ? `
                            <tr><td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #999; text-transform: uppercase;">Dati Pilota 2</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Nome 2:</td><td style="padding: 5px 0; font-weight: bold;">${userData.secondo_nome} ${userData.secondo_cognome || ''}</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Telefono 2:</td><td style="padding: 5px 0; font-weight: bold;">${userData.secondo_cellulare || 'N/A'}</td></tr>
                            ` : ''}

                            <tr><td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #999; text-transform: uppercase;">Emergenze & Salute</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Contatto Emergenza:</td><td style="padding: 5px 0; font-weight: bold;">${userData.emergency_contact_info} (${userData.emergency_contact_phone})</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Allergie/Note:</td><td style="padding: 5px 0; font-weight: bold;">${userData.food_preferences || 'Nessuna'}</td></tr>
                            
                            ${userData.pranzo_accompagnatori > 0 ? `
                            <tr><td style="padding: 5px 0; color: #888;">Ospiti Pranzo:</td><td style="padding: 5px 0; font-weight: bold;">${userData.pranzo_accompagnatori} (${userData.nomi_ospiti_pranzo})</td></tr>
                            ` : ''}

                            <tr><td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #FFCC00;"></td></tr>
                            <tr>
                                <td style="padding: 15px 0; color: #333; font-weight: 900; font-size: 16px;">TOTALE DOVUTO:</td>
                                <td style="padding: 15px 0; color: #E6007E; font-weight: 950; font-size: 22px;">€ ${userData.importo_dovuto},00</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 16px; color: #E6007E; font-weight: bold; margin-top: 30px;">
                        Ci vediamo nel fango! 🤘
                    </p>

                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 40px 0;">
                    
                    <div style="text-align: center; color: #999999; font-size: 12px;">
                        <p style="margin: 5px 0;">Renga Treffen 2026, Per qualsiasi domanda puoi rispondere direttamente a questa email.</p>
                    </div>
                </div>
            `
        });

        if (error) {
            return res.status(400).json({ error });
        }

        return res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
