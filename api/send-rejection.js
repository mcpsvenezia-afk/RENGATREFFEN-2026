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
            subject: `Comunicazione Iscrizione - Renga Treffen 2026`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; color: #333333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: 900;">RENGA TREFFEN 🏁</h1>
                    </div>

                    <h2 style="color: #333; font-size: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; display: inline-block;">Ciao ${userData.nome},</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
                        Ti ringraziamo per aver espresso interesse a partecipare al Renga Treffen 2026.
                    </p>

                    <p style="font-size: 16px; line-height: 1.6;">
                        Dopo un'attenta valutazione della tua richiesta nell'ambito delle disponibilità e dei criteri dell'evento, siamo spiacenti di informarti che <strong>non è possibile procedere con la tua iscrizione per questa edizione</strong>.
                    </p>

                    <div style="background-color: #f8f9fa; padding: 25px; margin: 30px 0; border: 1px solid #eee; border-radius: 10px;">
                        <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.6;">
                            Questo può dipendere dal raggiungimento dei limiti di capacità per la categoria scelta o da criteri di selezione tecnici. Speriamo di poterti accogliere in futuro nelle prossime iniziative.
                        </p>
                    </div>

                    <p style="font-size: 15px; color: #333; margin-top: 30px;">
                        Cordiali saluti,<br/>
                        <strong>Lo Staff Renga Treffen</strong>
                    </p>

                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 40px 0;">
                    
                    <div style="text-align: center; color: #999999; font-size: 12px;">
                        <p style="margin: 5px 0;">Renga Treffen 2026.</p>
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
