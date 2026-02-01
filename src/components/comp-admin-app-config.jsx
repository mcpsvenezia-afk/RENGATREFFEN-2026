import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function AppConfigTab({ isDevMode, onRefresh }) {
    const [config, setConfig] = useState({
        enable_proximity_audio: true,
        enable_photo_distance_check: true,
        enable_penalty_tracking: true,
        enable_live_tracking: true,
        enable_offline_sync: true,
        force_dev_mode_features: false
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'app_config').single();
        if (data) {
            setConfig({ ...config, ...data.value });
        }
    }

    async function handleSave() {
        setLoading(true);
        setSuccess(false);
        try {
            const { error } = await supabase.from('settings').upsert({
                id: 'app_config',
                value: config
            });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving app config:', err);
            Swal.fire({
                title: 'ERRORE',
                text: 'Errore durante il salvataggio: ' + err.message,
                icon: 'error',
                background: '#111',
                color: '#fff',
                confirmButtonColor: '#E6007E'
            });
        } finally {
            setLoading(false);
        }
    }

    const toggleFeature = (key) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const itemStyle = {
        background: '#1a1a1f',
        padding: '25px',
        borderRadius: '20px',
        border: '1px solid #333',
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: '0.3s'
    };

    const labelTitleStyle = {
        fontSize: '1rem',
        fontWeight: 900,
        color: '#fff',
        display: 'block',
        marginBottom: '5px'
    };

    const labelDescStyle = {
        fontSize: '0.8rem',
        color: '#888',
        lineHeight: '1.4'
    };

    const toggleBtnStyle = (active) => ({
        padding: '10px 20px',
        borderRadius: '50px',
        border: 'none',
        background: active ? '#4CAF50' : '#333',
        color: active ? '#000' : '#888',
        fontWeight: 900,
        cursor: 'pointer',
        minWidth: '100px',
        transition: '0.3s',
        boxShadow: active ? '0 0 15px rgba(76,175,80,0.4)' : 'none'
    });

    return (
        <div data-dna="APP-CONFIG-PANEL" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ color: '#00E5FF', fontSize: '2rem', fontWeight: 900, marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '2.5rem' }}>📱</span> GESTIONE FUNZIONALITÀ APP
            </h2>

            <div style={itemStyle}>
                <div>
                    <span style={labelTitleStyle}>ALLARME PROSSIMITÀ (AUDIO)</span>
                    <span style={labelDescStyle}>Il "Bip-Bip" quando i piloti sono separati da più di 200m.</span>
                </div>
                <button onClick={() => toggleFeature('enable_proximity_audio')} style={toggleBtnStyle(config.enable_proximity_audio)}>
                    {config.enable_proximity_audio ? 'ON' : 'OFF'}
                </button>
            </div>

            <div style={itemStyle}>
                <div>
                    <span style={labelTitleStyle}>BLOCCO FOTO DISTANZA (&gt;20m)</span>
                    <span style={labelDescStyle}>Impedisce lo scatto se i partner sono troppo lontani (Regolamento).</span>
                </div>
                <button onClick={() => toggleFeature('enable_photo_distance_check')} style={toggleBtnStyle(config.enable_photo_distance_check)}>
                    {config.enable_photo_distance_check ? 'ATTIVO' : 'IGNORA'}
                </button>
            </div>

            <div style={itemStyle}>
                <div>
                    <span style={labelTitleStyle}>TIMING PENALITÀ</span>
                    <span style={labelDescStyle}>Calcolo automatico dei secondi di separazione.</span>
                </div>
                <button onClick={() => toggleFeature('enable_penalty_tracking')} style={toggleBtnStyle(config.enable_penalty_tracking)}>
                    {config.enable_penalty_tracking ? 'ON' : 'OFF'}
                </button>
            </div>

            <div style={itemStyle}>
                <div>
                    <span style={labelTitleStyle}>LIVE TRACKING (GPS)</span>
                    <span style={labelDescStyle}>Invio continuo della posizione al server (consuma batteria).</span>
                </div>
                <button onClick={() => toggleFeature('enable_live_tracking')} style={toggleBtnStyle(config.enable_live_tracking)}>
                    {config.enable_live_tracking ? 'ON' : 'OFF'}
                </button>
            </div>

            <div style={itemStyle}>
                <div>
                    <span style={labelTitleStyle}>SYNC OFFLINE ENGINE</span>
                    <span style={labelDescStyle}>Sincronizzazione automatica dei log quando torna la rete.</span>
                </div>
                <button onClick={() => toggleFeature('enable_offline_sync')} style={toggleBtnStyle(config.enable_offline_sync)}>
                    {config.enable_offline_sync ? 'ON' : 'OFF'}
                </button>
            </div>

            <div style={{ ...itemStyle, borderColor: '#E6007E', background: 'rgba(230,0,126,0.05)' }}>
                <div>
                    <span style={{ ...labelTitleStyle, color: '#E6007E' }}>FORCE DEV MODE FEATURES</span>
                    <span style={labelDescStyle}>Abilita funzionalità di debug su tutti i device (Override globale).</span>
                </div>
                <button onClick={() => toggleFeature('force_dev_mode_features')} style={{ ...toggleBtnStyle(config.force_dev_mode_features), background: config.force_dev_mode_features ? '#E6007E' : '#333' }}>
                    {config.force_dev_mode_features ? 'FORZA' : 'NORMAL'}
                </button>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        backgroundColor: success ? '#4CAF50' : '#00E5FF',
                        color: '#000',
                        border: 'none',
                        padding: '20px 60px',
                        borderRadius: '50px',
                        fontWeight: 900,
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        boxShadow: '0 20px 40px rgba(0,229,255,0.2)',
                        transition: '0.3s'
                    }}
                >
                    {loading ? 'SALVATAGGIO...' : success ? '✓ CONFIGURAZIONE SALVATA!' : 'SALVA CONFIGURAZIONE APP'}
                </button>
            </div>
        </div>
    );
}
