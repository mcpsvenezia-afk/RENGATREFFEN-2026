import { Resend } from 'resend';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pilotA, pilotB } = req.body;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Resend API Key non configurata sul server.' });
    }

    const resend = new Resend(apiKey);

    try {
        const recipients = [pilotA.email];
        if (pilotB && pilotB.email) recipients.push(pilotB.email);

        const { data, error } = await resend.emails.send({
            from: 'Renga Treffen <info@rengatreffen.it>',
            reply_to: 'info@rengatreffen.it',
            to: recipients,
            subject: `🏁 TEAM CONFERMATO - Renga Treffen 2026`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #000; border: 2px solid #4CAF50; border-radius: 30px; color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4CAF50; margin: 0; font-size: 32px; font-weight: 900;">TEAM CONFERMATO! 🏁</h1>
                        <p style="color: #FFCC00; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">Renga Treffen 2026</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 50px;">🤝</span>
                    </div>

                    <h2 style="color: #fff; font-size: 22px; text-align: center; margin-bottom: 30px;">
                        Grandi notizie, ${pilotA.nome} e ${pilotB ? pilotB.nome : 'partner'}!
                    </h2>
                    
                    <p style="font-size: 18px; line-height: 1.6; text-align: center; color: #ccc;">
                        La reciprocità dei vostri numeri è stata verificata con successo.<br/>
                        <strong>Siete ufficialmente in gara insieme!</strong>
                    </p>

                    <div style="background-color: #111; border: 1px solid #333; padding: 25px; margin: 30px 0; border-radius: 20px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #4CAF50; text-transform: uppercase; text-align: center;">DETTAGLI TEAM</h3>
                        <div style="display: flex; justify-content: space-around; gap: 20px; text-align: center;">
                            <div>
                                <div style={{ color: '#888', fontSize: '12px' }}>PILOTA A</div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>${pilotA.nome} ${pilotA.cognome}</div>
                            </div>
                            <div style="font-size: 20px;">⚡</div>
                            <div>
                                <div style={{ color: '#888', fontSize: '12px' }}>PILOTA B</div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>${pilotB ? `${pilotB.nome} ${pilotB.cognome}` : 'N/D'}</div>
                            </div>
                        </div>
                    </div>

                    <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #888;">
                        Ora potete procedere con la preparazione dei mezzi e delle menti. <br/>
                        Il Renga Treffen vi aspetta.
                    </p>

                    <div style="margin-top: 40px; text-align: center;">
                        <p style="font-size: 20px; color: #FFCC00; font-weight: bold;">
                            Siete ufficialmente in gara insieme! 🤘🔥
                        </p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #222; margin: 40px 0;">
                    
                    <div style="text-align: center; color: #666; font-size: 12px;">
                        <p style="margin: 5px 0;">Questa è una notifica automatica del sistema CRM Renga Treffen.</p>
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
