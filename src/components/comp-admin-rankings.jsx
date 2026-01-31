import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RankingsTab({ registrations, onRefresh }) {
    const [logs, setLogs] = useState([]);
    const [raceParams, setRaceParams] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRaceData();
    }, []);

    async function fetchRaceData() {
        setLoading(true);
        try {
            const { data: logsData } = await supabase.from('race_logs').select('*').order('created_at', { ascending: true });
            setLogs(logsData || []);

            const { data: settData } = await supabase.from('settings').select('value').eq('id', 'event_params').single();
            if (settData) setRaceParams(settData.value.race_params || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const calculateTeamScore = (team) => {
        if (!team.target_times || Object.keys(team.target_times).length === 0) return 0;

        const teamLogs = logs.filter(l => l.registration_id === team.id);
        let totalPenalty = 0;
        const penaltyPerSkipped = raceParams.penalty_skipped_photo || 1000;

        Object.entries(team.target_times).forEach(([photoKey, targetTimeStr]) => {
            const photoNum = parseInt(photoKey.split('_')[1]);
            const log = teamLogs.find(l => l.photo_number === photoNum);

            if (!log) {
                totalPenalty += penaltyPerSkipped;
            } else {
                const targetDate = new Date();
                const [th, tm, ts] = targetTimeStr.split(':').map(Number);
                targetDate.setHours(th, tm, ts || 0, 0);

                const recordedDate = new Date(log.recorded_at);
                const diffSec = Math.abs(Math.floor((recordedDate.getTime() - targetDate.getTime()) / 1000));
                totalPenalty += diffSec;
            }
        });

        return totalPenalty;
    };

    const teamRankings = registrations
        .filter(r => r.team_name && r.team_name.toLowerCase() !== 'staff' && r.stato_iscrizione === 'Confermata' && r.team_role === 'Capitano')
        .map(r => ({
            name: r.team_name,
            bib: r.bib_number,
            score: calculateTeamScore(r),
            color: r.card_color,
            id: r.id,
            photoCount: logs.filter(l => l.registration_id === r.id).length
        }))
        .sort((a, b) => a.score - b.score);

    const getCardColor = (c) => {
        if (c === 'ROSSA') return '#ff4444';
        if (c === 'GIALLA') return '#FFCC00';
        if (c === 'VIOLA') return '#E6007E';
        return '#333';
    };

    return (
        <div data-dna="RANKINGS-PANEL" style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ color: '#00E5FF', fontSize: '2.4rem', fontWeight: 950, margin: 0, letterSpacing: '-1px' }}>CLASSIFICA GARA v7.8</h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>1 SECONDO = 1 PUNTO PENALITÀ | MINOR PUNTEGGIO VINCE</p>
                </div>
                <button
                    onClick={fetchRaceData}
                    disabled={loading}
                    style={{ background: '#111', color: '#00E5FF', border: '1px solid #333', padding: '12px 25px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' }}
                >
                    {loading ? '...' : '🔄 AGGIORNA LIVE'}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {teamRankings.map((team, index) => (
                    <div
                        key={team.id}
                        style={{
                            background: index === 0 ? 'linear-gradient(90deg, rgba(0,229,255,0.1), transparent)' : '#111',
                            padding: '25px 40px',
                            borderRadius: '30px',
                            border: `1px solid ${index === 0 ? '#00E5FF' : '#222'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                            boxShadow: index === 0 ? '0 10px 40px rgba(0,229,255,0.1)' : 'none',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* RANK NUMBER */}
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: index < 3 ? (index === 0 ? '#FFD700' : index === 1 ? '#C2C2C2' : '#CD7F32') : '#222',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 950,
                            color: '#000',
                            fontSize: '1.4rem'
                        }}>
                            {index + 1}
                        </div>

                        {/* TEAM INFO */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ color: getCardColor(team.color), fontSize: '0.7rem', fontWeight: 900, border: `1px solid ${getCardColor(team.color)}`, padding: '3px 10px', borderRadius: '50px' }}>{team.color || 'NON ASSEGNATA'}</span>
                                <span style={{ color: '#555', fontWeight: 900, fontSize: '0.8rem' }}>BIB #{team.bib}</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#fff', textTransform: 'uppercase', marginTop: '5px' }}>{team.name}</div>
                        </div>

                        {/* STATS */}
                        <div style={{ textAlign: 'center', padding: '0 30px', borderRight: '1px solid #222' }}>
                            <div style={{ color: '#666', fontSize: '0.65rem', fontWeight: 900, marginBottom: '5px' }}>FOTO LOGGATE</div>
                            <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>{team.photoCount} / 4</div>
                        </div>

                        {/* TOTAL SCORE */}
                        <div style={{ minWidth: '150px', textAlign: 'right' }}>
                            <div style={{ color: '#666', fontSize: '0.65rem', fontWeight: 900, marginBottom: '5px' }}>PUNTI PENALITÀ</div>
                            <div style={{ color: index === 0 ? '#00E5FF' : '#fff', fontSize: '2rem', fontWeight: 950 }}>{team.score.toLocaleString()}</div>
                        </div>
                    </div>
                ))}

                {teamRankings.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '100px', background: '#0c0c0e', border: '1px dashed #333', borderRadius: '40px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏁</div>
                        <div style={{ color: '#444', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>NESSUN TEAM IN GARA</div>
                    </div>
                )}
            </div>
        </div>
    );
}
