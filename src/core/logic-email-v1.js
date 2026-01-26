/**
 * 🧬 CORE: logic-email-v1.js
 * Proxy per l'invio email tramite Vercel Serverless Function (Bypass CORS).
 */

export async function sendWelcomeEmail(userData) {
    try {
        const response = await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userData }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[EMAIL] Server Error:', result.error);
            return { success: false, error: result.error };
        }

        return { success: true, data: result.data };
    } catch (err) {
        console.error('[EMAIL] Fetch Error:', err);
        return { success: false, error: err.message };
    }
}
