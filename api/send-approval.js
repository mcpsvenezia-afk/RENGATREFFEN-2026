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
            subject: `🏁 Fango, Motori e Gloria: La tua iscrizione al Renga Treffen 2026 è CONFERMATA!`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; color: #333333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #E6007E; margin: 0; font-size: 28px; font-weight: 900;">RENGA TREFFEN 🏁</h1>
                        <p style="color: #666; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">2° Memorial Antonio Armellin</p>
                    </div>

                    <h2 style="color: #333; font-size: 22px; border-bottom: 2px solid #FFCC00; padding-bottom: 10px; display: inline-block;">Ciao ${userData.nome}! 👋</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
                        È ufficiale: sei dei nostri! La tua richiesta per il 2° Memorial Antonio Armellin è stata elaborata e confermata con successo. Preparati, perché il Renga Treffen 2026 non sarà una passeggiata in centro, ma una vera sfida tra polvere e passione. 🤘
                    </p>

                    <div style="background-color: #f8f8f8; border-radius: 15px; padding: 25px; margin: 30px 0; border: 1px solid #eee;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #888; text-transform: uppercase;">Riepilogo Partecipazione:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold; width: 40%;">Team:</td>
                                <td style="padding: 8px 10px;">${userData.team_name || 'Individuale'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold;">Moto/Mezzo:</td>
                                <td style="padding: 8px 10px;">${userData.moto_details || 'Dato non fornito'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #555; font-weight: bold;">Numero Gara:</td>
                                <td style="padding: 8px 10px;"><strong>In assegnazione (lo scoprirai presto!)</strong></td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #fff9e6; border-left: 5px solid #FFCC00; padding: 25px; margin: 30px 0;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #856404; text-transform: uppercase;">💳 STEP FINALE: IL CONTRIBUTO AL FANGO</h3>
                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
                            Per rendere definitiva la tua posizione in griglia di partenza, procedi con il bonifico della quota di partecipazione. Ricorda: l'iscrizione è completa solo a pagamento ricevuto.
                        </p>
                        
                        <div style="background: #ffffff; padding: 15px; border-radius: 10px; border: 1px solid #ffeeba;">
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Beneficiario:</strong> ASSOCIAZIONE SPORTIVA DILETTANTISTICA FANGO TOURS</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>IBAN:</strong> <code style="font-size: 15px; background: #eee; padding: 2px 5px; border-radius: 4px;">IT55V0760111800001064700964</code></p>
                        </div>
                    </div>

                    <div style="margin: 30px 0;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333; text-transform: uppercase; border-bottom: 2px solid #eee; padding-bottom: 5px;">Quote di Iscrizione (Verifica la tua scelta):</h4>
                        <ul style="font-size: 14px; padding-left: 20px; line-height: 1.8;">
                            <li><strong>Caccia al Tesoro (Iscritti MCPS):</strong> &euro; 75,00 (Roadbook Digitale)</li>
                            <li><strong>Caccia al Tesoro (NON Iscritti MCPS):</strong> &euro; 85,00 (Roadbook Digitale)</li>
                            <li><strong>Formula DISCOVERY (Tutti):</strong> &euro; 85,00 (Traccia GPX dedicata)</li>
                            <li><strong>Formula 4x4 (Max 10 veicoli):</strong> &euro; 85,00 + &euro; 30,00 per ogni passeggero</li>
                        </ul>
                    </div>

                    <div style="background-color: #ffeeee; padding: 15px; border-radius: 10px; border: 1px solid #f8d7da; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 13px; color: #721c24;">
                            ⚠️ <strong>IMPORTANTE:</strong> Per partecipare &egrave; obbligatorio il tesseramento CSEN. Se non lo hai gi&agrave; fatto, segui le istruzioni sul sito.
                        </p>
                    </div>

                    <div style="background-color: #000; padding: 25px; border-radius: 15px; color: #fff; text-align: center;">
                        <h3 style="margin: 0 0 10px 0; color: #FFCC00; font-size: 18px;">🧭 LEGGI TUTTO (Davvero!)</h3>
                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            Abbiamo inserito ogni dettaglio logistico, tecnico e regolamentare sul nostro sito ufficiale. Ti chiediamo di leggerlo da cima a fondo.
                        </p>
                        <a href="https://www.rengatreffen.it" style="display: inline-block; background-color: #E6007E; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; text-transform: uppercase; font-size: 13px;">Vai al Sito Ufficiale</a>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; margin-top: 35px;">
                        Nelle prossime settimane riceverai il Regolamento Finale e le informazioni logistiche per il giorno dell'evento.
                    </p>

                    <p style="font-size: 18px; color: #E6007E; font-weight: bold; margin-top: 40px; text-align: center;">
                        Mettiti comodo, scalda i motori...<br/>Ci vediamo nel fango! 🤘🔥
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
