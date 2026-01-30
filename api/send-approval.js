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
            subject: `🏁 Iscrizione CONFERMATA - Renga Treffen 2026`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 20px; color: #333333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #E6007E; margin: 0; font-size: 28px; font-weight: 900;">RENGA TREFFEN 🏁</h1>
                        <p style="color: #666; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">2° Memorial Antonio Armellin</p>
                    </div>

                    <h2 style="color: #333; font-size: 22px; border-bottom: 2px solid #FFCC00; padding-bottom: 10px; display: inline-block;">Ciao ${userData.nome}! 👋</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
                        È ufficiale: sei dei nostri! La tua richiesta per il 2° Memorial Antonio Armellin è stata approvata con successo. Preparati, perché il Renga Treffen 2026 non sarà una passeggiata in centro, ma una vera sfida tra polvere e passione. 🤘
                    </p>

                    <div style="background-color: #fff9e6; border-left: 5px solid #FFCC00; padding: 25px; margin: 30px 0;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #856404; text-transform: uppercase;">💳 STEP FINALE: IL CONTRIBUTO</h3>
                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
                            Per rendere definitiva la tua posizione in griglia di partenza, procedi con il bonifico della quota di partecipazione. Ricorda: l'iscrizione è completa solo a pagamento ricevuto.
                        </p>
                        
                        <div style="background: #ffffff; padding: 15px; border-radius: 10px; border: 1px solid #ffeeba;">
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Beneficiario:</strong> ASSOCIAZIONE SPORTIVA DILETTANTISTICA FANGO TOURS</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>IBAN:</strong> <code style="font-size: 15px; background: #eee; padding: 2px 5px; border-radius: 4px;">IT55V0760111800001064700964</code></p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Causale:</strong> Renga Treffen 2026 - ${userData.nome} ${userData.cognome}</p>
                            <p style="margin: 5px 0; font-size: 16px; color: #E6007E;"><strong>Importo: € ${userData.importo_dovuto},00</strong></p>
                        </div>
                    </div>

                    <div style="background-color: #f8f8f8; border-radius: 15px; padding: 25px; margin: 30px 0; border: 1px solid #eee;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #888; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px;">Dati Registrati nel Sistema:</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr><td style="padding: 5px 0; color: #888; width: 40%;">Team:</td><td style="padding: 5px 0; font-weight: bold;">${userData.team_name || 'N/A'}</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Veicolo:</td><td style="padding: 5px 0; font-weight: bold;">${userData.moto_details || 'N/A'}</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Formula:</td><td style="padding: 5px 0; font-weight: bold;">${userData.formula_partecipazione.replace(/_/g, ' ')}</td></tr>
                            
                            <tr><td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #999; text-transform: uppercase;">Dati Pilota 1</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Nome:</td><td style="padding: 5px 0; font-weight: bold;">${userData.nome} ${userData.cognome}</td></tr>
                            
                            ${userData.secondo_nome ? `
                            <tr><td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #999; text-transform: uppercase;">Dati Pilota 2</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Nome 2:</td><td style="padding: 5px 0; font-weight: bold;">${userData.secondo_nome} ${userData.secondo_cognome || ''}</td></tr>
                            ` : ''}

                            <tr><td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #999; text-transform: uppercase;">Note Salute</td></tr>
                            <tr><td style="padding: 5px 0; color: #888;">Allergie/Note:</td><td style="padding: 5px 0; font-weight: bold;">${userData.food_preferences || 'Nessuna'}</td></tr>
                        </table>
                    </div>

                    <div style="background-color: #000; padding: 25px; border-radius: 15px; color: #fff; text-align: center;">
                        <h3 style="margin: 0 0 10px 0; color: #FFCC00; font-size: 18px;">🧭 IMPORTANTE! L'ISCRITTO DEVE:</h3>
                        <ul style="font-size: 14px; text-align: left; padding: 0 20px; color: #ccc;">
                            <li>Essere regolarmente tesserato CSEN o Fango Tours (se richiesto).</li>
                            <li>Avere patente e assicurazione veicolo in corso di validità.</li>
                            <li>Aver letto il regolamento completo sul sito.</li>
                        </ul>
                    </div>

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
