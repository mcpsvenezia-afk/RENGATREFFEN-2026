import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function SettingsTab({ isDevMode, onRefresh }) {
    const [settings, setSettings] = useState({
        max_moto: 30,
        max_4x4: 10,
        is_open: true,
        iban: 'IT55V0760111800001064700964',
        race_params: {
            start_time_caccia: '08:00',
            start_time_discovery: '09:00',
            start_time_4x4: '09:30',
            team_interval_minutes: 1,
            offset_red: 0,
            offset_yellow: 2,
            offset_purple: 4,
            penalty_skipped_photo: 1000
        }
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

    const parseTimeToMinutes = (timeStr) => {
        const [h, m] = (timeStr || '08:00').split(':').map(Number);
        return h * 60 + m;
    };

    const formatTime = (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    async function regenerateRaceTimes() {
        const result = await Swal.fire({
            title: 'SINCRONIZZA MOTORE GARA?',
            text: "Questa operazione ricalcolerà PARTENZE, COLORI SCHEDE e TEMPI OBIETTIVO per tutti i team. Proseguire?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#00E5FF',
            cancelButtonColor: '#333',
            confirmButtonText: 'SÌ, SINCRONIZZA TUTTO',
            cancelButtonText: 'ANNULLA',
            background: '#111',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const { data: regs, error: errRegs } = await supabase
                .from('registrations')
                .select('*')
                .eq('stato_iscrizione', 'Confermata')
                .order('bib_number', { ascending: true });

            if (errRegs) throw errRegs;

            const p = settings.race_params || {};
            const interval = p.team_interval_minutes || 1;
            const updates = [];
            const cardColors = ['ROSSA', 'GIALLA', 'VIOLA'];

            // First pass: Assign BIB numbers sequentially to all confirmed teams if not set or always for sync
            const allSorted = [...regs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            allSorted.forEach((r, idx) => {
                r.bib_number = (idx + 1).toString();
            });

            // Re-group with assigned bibs
            const caccia = allSorted.filter(r => r.formula_partecipazione?.startsWith('Caccia'));
            const discovery = allSorted.filter(r => r.formula_partecipazione === 'Discovery');
            const x4 = allSorted.filter(r => r.formula_partecipazione === '4x4');

            const photoBaseOffsets = [60, 120, 180, 240];
            let globalIdx = 0;

            const processGroup = (group, startTimeId) => {
                let currentMinutes = parseTimeToMinutes(p[startTimeId] || '08:00');
                group.sort((a, b) => parseInt(a.bib_number) - parseInt(b.bib_number));

                group.forEach((team) => {
                    const color = cardColors[globalIdx % 3];
                    const prefix = color.toLowerCase();
                    const depTime = formatTime(currentMinutes);

                    const offsets = [
                        p?.[`offset_${prefix}_1`] || 0,
                        p?.[`offset_${prefix}_2`] || 0,
                        p?.[`offset_${prefix}_3`] || 0,
                        p?.[`offset_${prefix}_4`] || 0
                    ];

                    const [h, m] = depTime.split(':').map(Number);
                    const depDate = new Date();
                    depDate.setHours(h, m, 0, 0);

                    const targets = {};
                    photoBaseOffsets.forEach((baseOffset, idx) => {
                        const multiplier = offsets[idx] || 0;
                        const targetDate = new Date(depDate.getTime() + (baseOffset + multiplier) * 60000);
                        const timeStr = targetDate.toLocaleTimeString('it-IT', {
                            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
                        });
                        targets[`photo_${idx + 1}`] = timeStr;
                    });

                    updates.push({
                        id: team.id,
                        bib_number: team.bib_number,
                        departure_time: depTime,
                        card_color: color,
                        target_times: targets
                    });

                    currentMinutes += interval;
                    globalIdx++;
                });
            };

            processGroup(caccia, 'start_time_caccia');
            processGroup(discovery, 'start_time_discovery');
            processGroup(x4, 'start_time_4x4');

            for (const upd of updates) {
                await supabase.from('registrations').update({
                    bib_number: upd.bib_number,
                    departure_time: upd.departure_time,
                    card_color: upd.card_color,
                    target_times: upd.target_times
                }).eq('id', upd.id);
            }

            if (onRefresh) onRefresh();
            Swal.fire({
                title: 'GARA SINCRONIZZATA!',
                text: `Configurazione completata per ${updates.length} team. Partenze, Colori e Checkpoint aggiornati.`,
                icon: 'success',
                background: '#111',
                color: '#fff',
                confirmButtonColor: '#00E5FF'
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'ERRORE SISTEMA',
                text: "Errore durante la sincronizzazione: " + err.message,
                icon: 'error',
                background: '#111',
                color: '#fff',
                confirmButtonColor: '#E6007E'
            });
        } finally {
            setLoading(false);
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

            <h3 style={{ color: '#00E5FF', fontSize: '1.4rem', fontWeight: 900, marginTop: '50px', marginBottom: '25px', textTransform: 'uppercase' }}>🏁 MOTORE GARA (v7.8)</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={itemStyle}>
                    <label style={labelStyle}>Ora Partenza CACCIA</label>
                    <input
                        type="time"
                        value={settings.race_params?.start_time_caccia || '08:00'}
                        onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, start_time_caccia: e.target.value } })}
                        style={inputStyle}
                    />
                </div>
                <div style={itemStyle}>
                    <label style={labelStyle}>Ora Partenza DISCOVERY</label>
                    <input
                        type="time"
                        value={settings.race_params?.start_time_discovery || '09:00'}
                        onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, start_time_discovery: e.target.value } })}
                        style={inputStyle}
                    />
                </div>
                <div style={itemStyle}>
                    <label style={labelStyle}>Ora Partenza 4x4</label>
                    <input
                        type="time"
                        value={settings.race_params?.start_time_4x4 || '09:30'}
                        onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, start_time_4x4: e.target.value } })}
                        style={inputStyle}
                    />
                </div>
                <div style={itemStyle}>
                    <label style={labelStyle}>Intervallo Team (Minuti)</label>
                    <input
                        type="number"
                        value={settings.race_params?.team_interval_minutes || 1}
                        onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, team_interval_minutes: parseInt(e.target.value) } })}
                        style={inputStyle}
                    />
                </div>
            </div>

            <div style={{ ...itemStyle, background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.2))' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                    {/* COLONNA ROSSA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <label style={{ ...labelStyle, color: '#ff4444', textAlign: 'center' }}>SCHEDA ROSSA</label>
                        {[1, 2, 3, 4].map(num => (
                            <div key={`red_${num}`}>
                                <label style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900 }}>OFFSET {num} (MIN)</label>
                                <input
                                    type="number"
                                    value={settings.race_params?.[`offset_red_${num}`] || 0}
                                    onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, [`offset_red_${num}`]: parseInt(e.target.value) } })}
                                    style={{ ...inputStyle, borderColor: 'rgba(255,68,68,0.2)' }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* COLONNA GIALLA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <label style={{ ...labelStyle, color: '#FFCC00', textAlign: 'center' }}>SCHEDA GIALLA</label>
                        {[1, 2, 3, 4].map(num => (
                            <div key={`yellow_${num}`}>
                                <label style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900 }}>OFFSET {num} (MIN)</label>
                                <input
                                    type="number"
                                    value={settings.race_params?.[`offset_yellow_${num}`] || 0}
                                    onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, [`offset_yellow_${num}`]: parseInt(e.target.value) } })}
                                    style={{ ...inputStyle, borderColor: 'rgba(255,204,0,0.2)' }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* COLONNA VIOLA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <label style={{ ...labelStyle, color: '#E6007E', textAlign: 'center' }}>SCHEDA VIOLA</label>
                        {[1, 2, 3, 4].map(num => (
                            <div key={`purple_${num}`}>
                                <label style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900 }}>OFFSET {num} (MIN)</label>
                                <input
                                    type="number"
                                    value={settings.race_params?.[`offset_purple_${num}`] || 0}
                                    onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, [`offset_purple_${num}`]: parseInt(e.target.value) } })}
                                    style={{ ...inputStyle, borderColor: 'rgba(230,0,126,0.2)' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={itemStyle}>
                <label style={labelStyle}>Penalità Foto Saltata (Secondi/Punti)</label>
                <input
                    type="number"
                    value={settings.race_params?.penalty_skipped_photo || 1000}
                    onChange={e => setSettings({ ...settings, race_params: { ...settings.race_params, penalty_skipped_photo: parseInt(e.target.value) } })}
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
                    data-dna="1502-TOGGLE-REGISTRATIONS"
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

            <div style={{ marginTop: '20px', padding: '30px', background: 'rgba(0,229,255,0.05)', borderRadius: '24px', border: '1px dashed #00E5FF', textAlign: 'center' }}>
                <h4 style={{ color: '#00E5FF', margin: '0 0 10px 0', fontSize: '0.9rem' }}>AZIONI AVANZATE GARA</h4>
                <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '20px' }}>Ricalcola colori schede e orari obiettivo per tutti i team.</p>
                <button
                    onClick={regenerateRaceTimes}
                    disabled={loading}
                    style={{
                        background: 'transparent',
                        color: '#00E5FF',
                        border: '2px solid #00E5FF',
                        padding: '12px 30px',
                        borderRadius: '50px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                    }}
                >
                    🚀 RIGENERA TEMPI OBIETTIVO
                </button>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <button
                    data-dna="1501-SAVE-SETTINGS"
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
