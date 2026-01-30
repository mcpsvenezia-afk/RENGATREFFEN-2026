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

        if (userData.stato_iscrizione === 'Lista_Attesa') {
            subject = `LISTA D'ATTESA - Renga Treffen ${userData.nome}`;
            statusTitle = "LISTA D'ATTESA";
            statusColor = '#FF4444'; // Red
            statusMessage = `
                <div style="background-color: #fff5f5; border-left: 5px solid #FF4444; padding: 20px; margin: 25px 0;">
                    <p style="font-size: 15px; color: #c53030; font-weight: bold; margin: 0; line-height: 1.5; text-transform: uppercase;">
                        ATTENZIONE: IL NUMERO MASSIMO DI ISCRITTI È STATO RAGGIUNTO. LA TUA ISCRIZIONE È STATA INSERITA IN LISTA D'ATTESA. TI CONTATTEREMO IN CASO DI RINUNCE.
                    </p>
                </div>
            `;
        } else if (userData.stato_iscrizione === 'In_Valutazione') {
            subject = `ISCRIZIONE IN VALUTAZIONE - Renga Treffen ${userData.nome}`;
            statusTitle = 'IN VALUTAZIONE';
            statusColor = '#FFA500'; // Orange
            statusMessage = `
                <div style="background-color: #fffaf0; border-left: 5px solid #FFA500; padding: 20px; margin: 25px 0;">
                    <p style="font-size: 15px; color: #856404; font-weight: bold; margin: 0; line-height: 1.5; text-transform: uppercase;">
                        LA TUA ISCRIZIONE È IN FASE DI VALUTAZIONE POICHÉ AL MOMENTO NON HAI INDICATO UN PARTNER PER LA COPPIA. TI CONTATTEREMO A BREVE.
                    </p>
                </div>
            `;
        } else {
            // STANDARD
            statusMessage = `
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
                        <h3 style="margin-top: 0; font-size: 14px; color: #888; text-transform: uppercase;">Dettagli Iscrizione:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold; width: 40%;">Pilota:</td>
                                <td style="padding: 8px 0;">${userData.nome} ${userData.cognome || ''}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold;">Formula:</td>
                                <td style="padding: 8px 0;">${userData.formula_partecipazione.replace(/_/g, ' ')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold;">Moto/Veicolo:</td>
                                <td style="padding: 8px 0;">${userData.moto_details || 'Dato non fornito'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold;">Importo Dovuto:</td>
                                <td style="padding: 8px 0; color: #E6007E; font-weight: 900; font-size: 18px;">€ ${userData.importo_dovuto},00</td>
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
