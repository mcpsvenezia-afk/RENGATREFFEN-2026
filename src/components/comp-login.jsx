/**
 * 🧬 COMPONENT: Admin Login
 * Goal: Magic Link login interface
 */

import React, { useState } from 'react';

export function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await onLogin(email);
        if (!error) setSent(true);
        else alert(error.message);
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0d0d12' }}>
            <div style={{ backgroundColor: '#1a1a23', padding: '3rem', borderRadius: '24px', border: '1px solid #333340', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                <h1 style={{ color: '#FFCC00', fontWeight: 900, marginBottom: '0.5rem' }}>ADMIN ACCESS</h1>
                <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Inserisci la tua email per ricevere il Magic Link</p>

                {sent ? (
                    <div style={{ padding: '2rem', backgroundColor: 'rgba(255, 204, 0, 0.1)', borderRadius: '12px', color: '#FFCC00' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✉️</div>
                        <strong>Email inviata!</strong>
                        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Controlla la tua casella di posta per accedere.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="email"
                            placeholder="Nome utente / Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid #333340',
                                backgroundColor: '#0d0d12',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '1rem',
                                borderRadius: '50px',
                                border: 'none',
                                backgroundColor: '#FFCC00',
                                color: '#000',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            {loading ? 'INVIO IN CORSO...' : 'RICEVI MAGIC LINK'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
