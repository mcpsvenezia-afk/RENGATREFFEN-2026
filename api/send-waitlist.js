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
            subject: `⚠️ LISTA D'ATTESA - Renga Treffen 2026`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; color: #333333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #666; margin: 0; font-size: 28px; font-weight: 900;">RENGA TREFFEN 🏁</h1>
                        <p style="color: #888; font-size: 14px; margin-top: 5px; text-transform: uppercase;">Aggiornamento Stato Iscrizione</p>
                    </div>

                    <h2 style="color: #333; font-size: 22px; border-bottom: 2px solid #FFCC00; padding-bottom: 10px; display: inline-block;">Ciao ${userData.nome}!</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
                        Ti informiamo che, a causa dell'elevato numero di richieste, la tua iscrizione è stata inserita ufficialmente nella <strong>LISTA D'ATTESA</strong> per il Renga Treffen 2026.
                    </p>

                    <div style="background-color: #fffaf0; border-left: 5px solid #FFA500; padding: 25px; margin: 30px 0;">
                        <p style="font-size: 15px; color: #856404; margin: 0; line-height: 1.6;">
                            Monitoriamo costantemente le rinunce e i pagamenti. Se dovesse liberarsi un posto nella tua categoria (${userData.formula_partecipazione.replace(/_/g, ' ')}), sarai il primo ad essere contattato per procedere con l'iscrizione definitiva.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <p style="font-size: 14px; color: #666;">Grazie per la pazienza e per la passione che ci dimostrate ogni anno.</p>
                        <p style="font-size: 16px; color: #333; font-weight: bold;">Lo Staff del Renga Treffen</p>
                    </div>

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
