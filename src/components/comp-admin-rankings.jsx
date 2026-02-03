import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RankingsTab({ registrations, onRefresh }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTeamId, setExpandedTeamId] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null); // { log, team, photoNum }
    const [eventParams, setEventParams] = useState(null);

    useEffect(() => {
        fetchRaceData();
        fetchSettings();
    }, []);

    async function fetchSettings() {
        const { data } = await supabase.from('settings').select('*').eq('id', 'event_params').single();
        if (data) setEventParams(data.value);
    }

    async function fetchRaceData() {
        setLoading(true);
        try {
            const { data: logsData } = await supabase
                .from('race_logs')
                .select('*')
                .order('recorded_at', { ascending: true });
            setLogs(logsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleValidatePhoto = async (logId) => {
        try {
            const { error } = await supabase
                .from('race_logs')
                .update({ validation_status: 'VALID' })
                .eq('id', logId);
            if (error) throw error;
            fetchRaceData();
            if (onRefresh) onRefresh();
        } catch (err) { alert("Errore: " + err.message); }
    };

    const handleRejectPhoto = async (logId) => {
        try {
            const { error } = await supabase
                .from('race_logs')
                .update({ validation_status: 'REJECTED' })
                .eq('id', logId);
            if (error) throw error;
            fetchRaceData();
        } catch (err) { alert("Errore: " + err.message); }
    };

    const handleDeletePhoto = async (logId) => {
        if (!confirm("Eliminare definitivamente?")) return;
        try {
            await supabase.from('race_logs').delete().eq('id', logId);
            fetchRaceData();
        } catch (err) { alert("Errore: " + err.message); }
    };

    const handleSkipPhoto = async (team, photoNum) => {
        try {
            await supabase.from('race_logs').insert([{
                registration_id: team.members[0].id,
                photo_number: photoNum,
                validation_status: 'SALTATA',
                photo_url: null,
                recorded_at: new Date().toISOString()
            }]);
            fetchRaceData();
        } catch (err) { alert("Errore: " + err.message); }
    };

    const getTeamLogs = (teamRegId) => {
        return logs.filter(l => l.registration_id === teamRegId);
    };

    // Group registrations by Team (ONLY CACCIA for rankings)
    const teams = registrations.reduce((acc, r) => {
        if (!r.team_name || r.team_name.toLowerCase() === 'staff') return acc;
        // Only Caccia formula participates in the competitive ranking
        if (!r.formula_partecipazione?.startsWith('Caccia')) return acc;

        // Find existing team group
        let group = acc.find(g => g.name === r.team_name);
        if (!group) {
            group = {
                name: r.team_name,
                id: r.id,
                color: r.card_color,
                members: [],
                score: 0
            };
            acc.push(group);
        }
        group.members.push(r);
        return acc;
    }, []);

    // Helper to get time details
    const getLogDetails = (team, attemptNumber) => {
        // Collect ALL logs for this team (from any member)
        const teamMemberIds = team.members.map(m => m.id);
        const teamLogs = logs.filter(l => teamMemberIds.includes(l.registration_id) && l.photo_number === attemptNumber);

        // Return the "best" or most relevant log (e.g., first one usually)
        return teamLogs[0];
    };

    // Calculate Scores (Based on VALID photos and offsets)
    teams.forEach(team => {
        const teamMemberIds = team.members.map(m => m.id);
        const teamLogs = logs.filter(l => teamMemberIds.includes(l.registration_id));

        // Photo Count = Only VALIDATED ones or PENDING (for organizer to see work)
        // Skipped photos also count as "processed" but with penalty
        const processedCount = teamLogs.filter(l => l.validation_status === 'VALID' || l.validation_status === 'SALTATA').length;
        team.photoCount = processedCount;

        // TOTAL SCORE CALCULATION (Simplified: absolute diff in seconds for valid logs)
        let totalPenalty = 0;
        teamLogs.forEach(log => {
            if (log.validation_status === 'VALID') {
                const targetTimeStr = team.members[0]?.target_times?.[`photo_${log.photo_number}`];
                if (targetTimeStr) {
                    const [tH, tM, tS] = targetTimeStr.split(':').map(Number);
                    const targetDate = new Date(log.recorded_at);
                    targetDate.setHours(tH, tM, tS || 0, 0);
                    const diffMs = Math.abs(new Date(log.recorded_at) - targetDate);
                    totalPenalty += Math.floor(diffMs / 1000);
                } else {
                    // Fallback using category base from settings
                    const formula = team.members[0]?.formula_partecipazione || "";
                    let baseTime = "09:00";
                    if (formula.startsWith("Caccia")) baseTime = eventParams?.race_params?.start_time_caccia || "21:30";
                    else if (formula === "Discovery") baseTime = eventParams?.race_params?.start_time_discovery || "22:30";
                    else if (formula === "4x4") baseTime = eventParams?.race_params?.start_time_4x4 || "23:00";

                    const [startH, startM] = baseTime.split(':').map(Number);
                    const targetDate = new Date(log.recorded_at);
                    targetDate.setHours(startH, startM, 0, 0);
                    const diffMs = Math.abs(new Date(log.recorded_at) - targetDate);
                    totalPenalty += Math.floor(diffMs / 1000);
                }
            } else if (log.validation_status === 'SALTATA') {
                const skipPenalty = eventParams?.race_params?.penalty_skipped_photo || 3600;
                totalPenalty += skipPenalty;
            }
        });
        team.totalScore = totalPenalty;
    });

    // Sort teams by SCORE (Lower is better)
    teams.sort((a, b) => a.totalScore - b.totalScore);

    const toggleExpand = (teamId) => {
        setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ color: '#00E5FF', fontSize: '2.4rem', fontWeight: 950, margin: 0, letterSpacing: '-1px' }}>CLASSIFICA & VERIFICA</h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>LIVE RANKING • PHOTO VALIDATION • TIME CHECK</p>
                </div>
                <button
                    onClick={fetchRaceData}
                    disabled={loading}
                    style={{ background: '#111', color: '#00E5FF', border: '1px solid #333', padding: '12px 25px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' }}
                >
                    {loading ? '...' : '🔄 AGGIORNA LIVE'}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {teams.map((team, index) => (
                    <div key={team.id} style={{ background: '#111', borderRadius: '24px', border: '1px solid #222', overflow: 'hidden' }}>

                        {/* HEADER RIGA TEAM */}
                        <div
                            onClick={() => toggleExpand(team.id)}
                            style={{
                                padding: '20px 30px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                cursor: 'pointer',
                                background: expandedTeamId === team.id ? 'rgba(255,255,255,0.02)' : 'transparent',
                                transition: '0.2s'
                            }}
                        >
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 900, fontSize: '1.2rem', border: '1px solid #333'
                            }}>
                                {index + 1}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{team.name}</span>
                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${team.color === 'GIALLA' ? '#FFCC00' : '#E6007E'}`, color: team.color === 'GIALLA' ? '#FFCC00' : '#E6007E' }}>
                                        {team.color}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                                    {team.members.map(m => `${m.nome} ${m.cognome} (${m.bib_number})`).join(' • ')}
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '0 20px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 900 }}>PUNTEGGIO</div>
                                <div style={{ fontSize: '1.2rem', color: '#00E5FF', fontWeight: 900 }}>{team.totalScore} <small style={{ fontSize: '0.6rem', color: '#444' }}>sec</small></div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '0 20px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 900 }}>PROVE</div>
                                <div style={{ fontSize: '1.2rem', color: '#FFCC00', fontWeight: 900 }}>{team.photoCount} / 6</div>
                            </div>

                            <div style={{ transform: expandedTeamId === team.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', color: '#666' }}>
                                ▼
                            </div>
                        </div>

                        {/* DETTAGLIO ESPANSO (TABELLA TEMPI E FOTO) */}
                        {expandedTeamId === team.id && (
                            <div style={{ padding: '0 30px 30px 30px', borderTop: '1px solid #222' }}>
                                <h4 style={{ color: '#00E5FF', margin: '20px 0 15px 0', textTransform: 'uppercase', fontSize: '0.9rem' }}>🔍 Dettaglio Prove & Passaggi</h4>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #333', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Obiettivo / Foto</th>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Orario Previsto</th>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Orario Effettivo</th>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Scostamento</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Prova Fotografica</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3, 4, 5, 6].map(num => {
                                                const log = getLogDetails(team, num);

                                                // SOURCE OF TRUTH: target_times from registration
                                                let targetTimeStr = "--:--";
                                                if (team.members[0]?.target_times?.[`photo_${num}`]) {
                                                    targetTimeStr = team.members[0].target_times[`photo_${num}`].substring(0, 5);
                                                } else {
                                                    // Fallback using category base from settings
                                                    const formula = team.members[0]?.formula_partecipazione || "";
                                                    let baseTime = "09:00";
                                                    if (formula.startsWith("Caccia")) baseTime = eventParams?.race_params?.start_time_caccia || "21:30";
                                                    else if (formula === "Discovery") baseTime = eventParams?.race_params?.start_time_discovery || "22:30";
                                                    else if (formula === "4x4") baseTime = eventParams?.race_params?.start_time_4x4 || "23:00";

                                                    const [startH, startM] = baseTime.split(':').map(Number);
                                                    const targetDate = new Date();
                                                    targetDate.setHours(startH, startM, 0);
                                                    targetTimeStr = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                }

                                                const actualTimeStr = log ? new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';

                                                let diffStr = "--";
                                                let diffColor = "#666";

                                                if (log && log.recorded_at) {
                                                    const logTime = new Date(log.recorded_at);
                                                    const [tH, tM] = targetTimeStr.split(':').map(Number);
                                                    const targetDate = new Date(logTime);
                                                    targetDate.setHours(tH, tM, 0, 0);

                                                    const diffMs = logTime - targetDate;
                                                    const diffSec = Math.floor(diffMs / 1000);
                                                    const absDiff = Math.abs(diffSec);

                                                    const sign = diffSec > 0 ? "+" : "-";
                                                    const mm = Math.floor(absDiff / 60).toString().padStart(2, '0');
                                                    const ss = (absDiff % 60).toString().padStart(2, '0');

                                                    diffStr = `${sign}${mm}:${ss}`;
                                                    diffColor = absDiff < 60 ? '#4CAF50' : (absDiff < 300 ? '#FFCC00' : '#ff4444');
                                                }

                                                return (
                                                    <tr key={num} style={{ borderBottom: '1px solid #222' }}>
                                                        <td style={{ padding: '15px', fontWeight: 900, color: '#fff' }}>
                                                            STEP {num}
                                                        </td>
                                                        <td style={{ padding: '15px', color: '#aaa', fontFamily: 'monospace' }}>
                                                            {targetTimeStr}
                                                        </td>
                                                        <td style={{ padding: '15px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                            {actualTimeStr}
                                                        </td>
                                                        <td style={{ padding: '15px', color: diffColor, fontWeight: 900, fontFamily: 'monospace' }}>
                                                            {diffStr}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                            {log ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                                    {log.photo_url ? (
                                                                        <div
                                                                            style={{ position: 'relative', cursor: 'pointer' }}
                                                                            onClick={() => setSelectedPhoto({ log, team, photoNum: num })}
                                                                        >
                                                                            <img
                                                                                src={log.photo_url}
                                                                                alt={`Foto ${num}`}
                                                                                style={{
                                                                                    width: '100px',
                                                                                    height: '75px',
                                                                                    objectFit: 'cover',
                                                                                    borderRadius: '12px',
                                                                                    border: log.validation_status === 'VALID' ? '3px solid #4CAF50' :
                                                                                        log.validation_status === 'REJECTED' ? '3px solid #F44336' : '1px solid #444',
                                                                                    opacity: log.validation_status === 'REJECTED' ? 0.3 : 1
                                                                                }}
                                                                            />
                                                                            {log.validation_status === 'VALID' && <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#4CAF50', color: '#000', borderRadius: '50%', padding: '4px', fontSize: '0.7rem', fontWeight: 900 }}>✅</div>}
                                                                            {log.validation_status === 'REJECTED' && <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#F44336', color: '#fff', borderRadius: '50%', padding: '4px', fontSize: '0.7rem', fontWeight: 900 }}>❌</div>}
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#888', fontSize: '0.7rem', fontWeight: 900 }}>
                                                                            🚫 SALTATA
                                                                        </div>
                                                                    )}

                                                                    {log.photo_url && (
                                                                        <div style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900 }}>CLICCA PER GESTIRE</div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleSkipPhoto(team, num)}
                                                                    style={{ border: '1px dashed #333', background: 'transparent', color: '#444', padding: '8px 15px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}
                                                                >
                                                                    + SEGNA SALTATA
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 🖼️ PHOTO PREVIEW MODAL */}
            {selectedPhoto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 10000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '40px', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ position: 'absolute', top: '30px', right: '30px', cursor: 'pointer', color: '#fff', fontSize: '2rem' }} onClick={() => setSelectedPhoto(null)}>✕</div>

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ color: '#00E5FF', margin: 0, fontSize: '2rem', fontWeight: 950 }}>{selectedPhoto.team.name}</h2>
                        <p style={{ color: '#fff', margin: '5px 0', fontSize: '1.2rem', fontWeight: 900 }}>STEP {selectedPhoto.photoNum} / {selectedPhoto.team.color}</p>
                    </div>

                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '60vh', borderRadius: '30px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 50px 100px rgba(0,0,0,0.8)' }}>
                        <img
                            src={selectedPhoto.log.photo_url}
                            style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block' }}
                            alt="Full Preview"
                        />
                        {selectedPhoto.log.validation_status === 'VALID' && (
                            <div style={{ position: 'absolute', top: 20, right: 20, background: '#4CAF50', color: '#000', padding: '10px 30px', borderRadius: '100px', fontWeight: 900 }}>APPROVATA ✓</div>
                        )}
                        {selectedPhoto.log.validation_status === 'REJECTED' && (
                            <div style={{ position: 'absolute', top: 20, right: 20, background: '#F44336', color: '#fff', padding: '10px 30px', borderRadius: '100px', fontWeight: 900 }}>SCARTATA ❌</div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                        <button
                            onClick={async () => {
                                await handleValidatePhoto(selectedPhoto.log.id);
                                setSelectedPhoto(null);
                            }}
                            style={{
                                padding: '20px 40px', borderRadius: '100px', border: 'none', background: '#4CAF50', color: '#000',
                                fontSize: '1.1rem', fontWeight: 950, cursor: 'pointer', boxShadow: '0 10px 30px rgba(76,175,80,0.3)',
                                opacity: selectedPhoto.log.validation_status === 'VALID' ? 0.5 : 1
                            }}
                        >APPROVA FOTO</button>

                        <button
                            onClick={async () => {
                                await handleRejectPhoto(selectedPhoto.log.id);
                                setSelectedPhoto(null);
                            }}
                            style={{
                                padding: '20px 40px', borderRadius: '100px', border: 'none', background: '#F44336', color: '#fff',
                                fontSize: '1.1rem', fontWeight: 950, cursor: 'pointer', boxShadow: '0 10px 30px rgba(244,67,54,0.3)',
                                opacity: selectedPhoto.log.validation_status === 'REJECTED' ? 0.5 : 1
                            }}
                        >SCARTA FOTO</button>

                        <button
                            onClick={async () => {
                                await handleDeletePhoto(selectedPhoto.log.id);
                                setSelectedPhoto(null);
                            }}
                            style={{
                                padding: '20px 40px', borderRadius: '100px', border: '2px solid #333', background: 'transparent', color: '#666',
                                fontSize: '1.1rem', fontWeight: 950, cursor: 'pointer'
                            }}
                        >ELIMINA LOG</button>
                    </div>
                </div>
            )}
        </div>
    );
}
