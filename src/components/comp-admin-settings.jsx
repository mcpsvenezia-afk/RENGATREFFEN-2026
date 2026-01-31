import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function SettingsTab({ isDevMode }) {
    const [settings, setSettings] = useState({
        max_moto: 30,
        max_4x4: 10,
        is_open: true,
        iban: 'IT55V0760111800001064700964'
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'event_params').single();
        if (data) {
            setSettings(data.value);
        }
    }

    async function handleSave() {
        setLoading(true);
        setSuccess(false);
        try {
            const { error } = await supabase.from('settings').upsert({
                id: 'event_params',
                value: settings
            });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Errore durante il salvataggio: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    const itemStyle = {
        background: '#1a1a1f',
        padding: '30px',
        borderRadius: '24px',
        border: '1px solid #333',
        marginBottom: '20px'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: 900,
        color: '#888',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    };

    const inputStyle = {
        width: '100%',
        background: '#000',
        border: '1px solid #444',
        color: '#fff',
        padding: '15px',
        borderRadius: '12px',
        fontSize: '1.1rem',
        outline: 'none',
        transition: '0.3s'
    };

    return (
        <div data-dna="SETTINGS-PANEL" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ color: '#FFCC00', fontSize: '2rem', fontWeight: 900, marginBottom: '40px' }}>IMPOSTAZIONI EVENTO</h2>

            <div style={itemStyle}>
                <label style={labelStyle}>Tetto Massimo Iscritti (MOTO / DISCOVERY)</label>
                <input
                    type="number"
                    value={settings.max_moto}
                    onChange={e => setSettings({ ...settings, max_moto: parseInt(e.target.value) })}
                    style={inputStyle}
                />
            </div>

            <div style={itemStyle}>
                <label style={labelStyle}>Tetto Massimo Iscritti (AUTO 4x4)</label>
                <input
                    type="number"
                    value={settings.max_4x4}
                    onChange={e => setSettings({ ...settings, max_4x4: parseInt(e.target.value) })}
                    style={inputStyle}
                />
            </div>

            <div style={itemStyle}>
                <label style={labelStyle}>Coordinate IBAN (Per email di conferma)</label>
                <input
                    type="text"
                    value={settings.iban}
                    onChange={e => setSettings({ ...settings, iban: e.target.value })}
                    style={inputStyle}
                />
            </div>

            <div style={{ ...itemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={labelStyle}>Stato Iscrizioni Online</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: settings.is_open ? '#4CAF50' : '#E6007E' }}>
                        {settings.is_open ? '● APERTE' : '○ CHIUSE'}
                    </span>
                </div>
                <button
                    onClick={() => setSettings({ ...settings, is_open: !settings.is_open })}
                    style={{
                        padding: '10px 25px',
                        borderRadius: '50px',
                        border: 'none',
                        background: settings.is_open ? 'rgba(230,0,126,0.1)' : 'rgba(76,175,80,0.1)',
                        color: settings.is_open ? '#E6007E' : '#4CAF50',
                        fontWeight: 900,
                        cursor: 'pointer'
                    }}
                >
                    {settings.is_open ? 'CHIUDI ORA' : 'APRI ORA'}
                </button>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        backgroundColor: success ? '#4CAF50' : '#FFCC00',
                        color: '#000',
                        border: 'none',
                        padding: '20px 60px',
                        borderRadius: '50px',
                        fontWeight: 900,
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        boxShadow: '0 20px 40px rgba(255,204,0,0.2)',
                        transition: '0.3s'
                    }}
                >
                    {loading ? 'SALVATAGGIO...' : success ? '✓ SALVATO!' : 'SALVA IMPOSTAZIONI'}
                </button>
            </div>
        </div>
    );
}
