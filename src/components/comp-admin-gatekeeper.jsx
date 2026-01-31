import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AUTHORIZED_EMAIL = 'augello.mario@gmail.com';

export function AdminGatekeeper({ children, isDevMode }) {
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('EMAIL'); // EMAIL, OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user.email === AUTHORIZED_EMAIL) {
                setSession(session);
            } else if (session) {
                // Wrong user logged in? Sign out.
                supabase.auth.signOut();
            }
            setChecking(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session && session.user.email === AUTHORIZED_EMAIL) {
                setSession(session);
            } else {
                setSession(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError(null);

        if (email.toLowerCase() !== AUTHORIZED_EMAIL) {
            setError('ACCESSO NEGATO: Email non autorizzata.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: true
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setStep('OTP');
        }
        setLoading(false);
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email' // Standard for OTP code via email
        });

        if (error) {
            setError('Codice non valido o scaduto.');
        } else if (data.user?.email !== AUTHORIZED_EMAIL) {
            setError('Email non autorizzata dopo verifica.');
            await supabase.auth.signOut();
        }
        setLoading(false);
    };

    if (checking) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#0c0c0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>VERIFICA IDENTITÀ...</div>
            </div>
        );
    }

    if (session) {
        return children;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0c0c0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ backgroundColor: '#111', padding: '50px', borderRadius: '40px', border: '1px solid #333', maxWidth: '450px', width: '90%', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', textAlign: 'center' }}>
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '4px', color: '#fff' }}>
                        RENGATREFFEN <span style={{ color: '#FFCC00' }}>CMS</span>
                    </h1>
                    <p style={{ color: '#666', marginTop: '10px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 900 }}>Accesso Riservato</p>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'rgba(230,0,126,0.1)', color: '#E6007E', padding: '15px', borderRadius: '15px', marginBottom: '25px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid #E6007E' }}>
                        ⚠️ {error}
                    </div>
                )}

                {step === 'EMAIL' ? (
                    <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#888', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Email Amministratore</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="mario@esempio.it"
                                required
                                style={{ width: '100%', background: '#000', border: '1px solid #444', color: '#fff', padding: '18px', borderRadius: '15px', fontSize: '1rem', outline: 'none' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(255,204,0,0.2)' }}
                        >
                            {loading ? 'INVIO IN CORSO...' : 'INVIA CODICE OTP 🚀'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#888', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Inserisci Codice (6 cifre)</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                required
                                style={{ width: '100%', background: '#000', border: '1px solid #444', color: '#FFCC00', padding: '18px', borderRadius: '15px', fontSize: '2rem', textAlign: 'center', letterSpacing: '10px', outline: 'none', fontWeight: 900 }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: '#4CAF50', color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? 'VERIFICA...' : 'ENTRA NELLA DASHBOARD 🏁'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('EMAIL')}
                            style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Cambia Email
                        </button>
                    </form>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;900&display=swap');
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
