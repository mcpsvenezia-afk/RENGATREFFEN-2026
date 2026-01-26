import { Resend } from 'resend';

// Per evitare problemi di CORS, questa funzione deve girare Lato Server (Vercel Serverless)
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
            return res.status(400).json({ error });
        }

        return res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
