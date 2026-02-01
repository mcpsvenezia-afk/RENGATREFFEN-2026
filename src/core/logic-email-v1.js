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

export async function sendApprovalEmail(userData) {
    try {
        const response = await fetch('/api/send-approval', {
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
export async function sendWaitlistEmail(userData) {
    try {
        const response = await fetch('/api/send-waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData }),
        });
        const result = await response.json();
        if (!response.ok) return { success: false, error: result.error };
        return { success: true, data: result.data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function sendRejectionEmail(userData) {
    try {
        const response = await fetch('/api/send-rejection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData }),
        });
        const result = await response.json();
        if (!response.ok) return { success: false, error: result.error };
        return { success: true, data: result.data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function notifyStaffNewRegistration(userData) {
    try {
        const response = await fetch('/api/notify-staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData }),
        });
        const result = await response.json();
        if (!response.ok) {
            console.warn('[STAFF-NOTIFY] Failed to send but not blocking:', result.error);
            return { success: false, error: result.error };
        }
        console.log('[STAFF-NOTIFY] Admin notificato con successo');
        return { success: true, data: result.data };
    } catch (err) {
        console.warn('[STAFF-NOTIFY] Error but not blocking registration:', err);
        return { success: false, error: err.message };
    }
}

