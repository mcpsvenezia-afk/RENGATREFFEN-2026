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
        const { data, error } = await resend.emails.send({
            from: 'Renga Treffen <info@rengatreffen.it>',
            reply_to: 'info@rengatreffen.it',
            to: [userData.email],
            subject: `Iscrizione Confermata - Renga Treffen 2026 🏁`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; color: #333333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #E6007E; margin: 0; font-size: 28px; font-weight: 900;">RENGA TREFFEN 🏁</h1>
                        <p style="color: #666; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">2° Memorial Antonio Armellin</p>
                    </div>

                    <h2 style="color: #333; font-size: 22px; border-bottom: 2px solid #FFCC00; padding-bottom: 10px; display: inline-block;">Ciao ${userData.nome}! 👋</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
                        È ufficiale! La tua richiesta di iscrizione per il <strong>Renga Treffen 2026</strong> è stata <strong>CONFERMATA</strong> con successo. ✅
                    </p>

                    <div style="background-color: #f8f8f8; border-radius: 15px; padding: 25px; margin: 30px 0; border: 1px solid #eee;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #888; text-transform: uppercase;">Dati della tua partecipazione:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold; width: 40%;">Team:</td>
                                <td style="padding: 8px 0;">${userData.team_name || 'Individuale'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold;">Moto:</td>
                                <td style="padding: 8px 0;">${userData.moto_details || 'Dato non fornito'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold;">Numero Gara:</td>
                                <td style="padding: 8px 0;">${userData.bib_number || 'In assegnazione'}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 16px; line-height: 1.6;">
                        Nelle prossime settimane riceverai via email il <strong>Regolamento Finale</strong> e tutte le informazioni logistiche necessarie per il giorno dell'evento.
                    </p>

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
