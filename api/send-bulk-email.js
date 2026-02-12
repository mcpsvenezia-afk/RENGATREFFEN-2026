import { Resend } from 'resend';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { recipients, subject, htmlContent } = req.body;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Resend API Key non configurata sul server.' });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Lista destinatari mancante o vuota.' });
    }

    if (!subject || !htmlContent) {
        return res.status(400).json({ error: 'Oggetto o contenuto email mancante.' });
    }

    const resend = new Resend(apiKey);

    // Batch limit is 100
    if (recipients.length > 100) {
        return res.status(400).json({ error: 'Limite di 100 destinatari per invio superato. Riduci la selezione.' });
    }

    try {
        const emailBatch = recipients.map(recipient => ({
            from: 'Renga Treffen <info@rengatreffen.it>',
            to: [recipient.email],
            subject: subject,
            html: htmlContent.replace('{{NOME}}', recipient.name || 'Biker'), // Simple placeholder replacement
            reply_to: 'info@rengatreffen.it'
        }));

        const { data, error } = await resend.batch.send(emailBatch);

        if (error) {
            console.error('Resend Batch Error:', error);
            return res.status(400).json({ error });
        }

        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('Server Handler Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
