/**
 * 🧬 API: POST /api/crm/send-reply
 * Purpose: Send admin reply and save to thread history
 * Features: Email notification + DB persistence
 */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messageId, userEmail, userName, content, adminName = 'Admin' } = req.body;

    if (!userEmail || !content) {
        return res.status(400).json({ error: 'userEmail and content required' });
    }

    try {
        let reply = null;

        // 1. Try to save reply to database (may fail if table doesn't exist yet)
        try {
            console.log('Attempting to save reply to DB:', { messageId, userEmail, content: content.substring(0, 50) });

            const { data: replyData, error: dbError } = await supabase
                .from('crm_replies')
                .insert([{
                    message_id: messageId || null,
                    user_email: userEmail,
                    content: content,
                    direction: 'outbound',
                    admin_name: adminName
                }])
                .select()
                .single();

            if (dbError) {
                console.error('DB insert ERROR:', dbError);
                console.error('Error details:', JSON.stringify(dbError, null, 2));
            } else {
                reply = replyData;
                console.log('✅ Reply saved to DB successfully:', reply.id);
            }
        } catch (dbErr) {
            console.error('DB insert EXCEPTION:', dbErr);
            console.error('Exception details:', dbErr.message, dbErr.stack);
        }

        // 2. Send email notification (this should always work)
        const emailData = await resend.emails.send({
            from: 'Renga Treffen <info@rengatreffen.it>',
            to: [userEmail],
            subject: '💬 Risposta dal Team Renga Treffen',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Inter', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #FFCC00, #E6007E); padding: 40px; text-align: center; }
                        .header h1 { color: #000; margin: 0; font-size: 28px; font-weight: 900; }
                        .content { padding: 40px; }
                        .message-box { background: #f9f9f9; border-left: 5px solid #FFCC00; padding: 25px; border-radius: 10px; margin: 20px 0; }
                        .message-box p { color: #333; font-size: 16px; line-height: 1.6; margin: 0; }
                        .footer { background: #111; color: #888; padding: 30px; text-align: center; font-size: 14px; }
                        .btn { display: inline-block; background: #FFCC00; color: #000; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: 900; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>💬 Hai ricevuto una risposta</h1>
                        </div>
                        <div class="content">
                            <p style="color: #666; font-size: 16px;">Ciao <strong>${userName || 'Pilota'}</strong>,</p>
                            <p style="color: #666; font-size: 16px; margin-top: 15px;">Il team Renga Treffen ha risposto al tuo messaggio:</p>
                            
                            <div class="message-box">
                                <p>${content.replace(/\n/g, '<br>')}</p>
                            </div>

                            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                Se hai altre domande, rispondi direttamente a questa email.
                            </p>

                            <a href="https://www.rengatreffen.it/contatti" class="btn">CONTATTACI</a>
                        </div>
                        <div class="footer">
                            <p>© 2026 Renga Treffen - Memorial Antonio Armellin</p>
                            <p style="margin-top: 10px; font-size: 12px;">Powered by MotoReporter.it</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('Email sent successfully:', emailData.id);

        // 3. Try to log email send in notes (optional, may fail)
        if (messageId) {
            try {
                await supabase.from('message_notes').insert([{
                    message_id: messageId,
                    content: `🤖 AUTO: Risposta inviata via email a ${userEmail}`,
                    admin_name: 'System'
                }]);
            } catch (noteErr) {
                console.warn('Note insert failed:', noteErr);
            }
        }

        res.status(200).json({
            success: true,
            reply,
            emailId: emailData.id,
            message: 'Email inviata con successo' + (reply ? ' e salvata nel database' : '')
        });

    } catch (error) {
        console.error('Send reply error:', error);
        res.status(500).json({
            error: error.message,
            details: error.toString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
