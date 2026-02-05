import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RankingsTab({ registrations, onRefresh, isDevMode }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTeamId, setExpandedTeamId] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null); // { log, team, photoNum }
    const [eventParams, setEventParams] = useState(null);

    useEffect(() => {
        fetchRaceData();
        fetchSettings();

        // 🔄 AUTO-REFRESH: Aggiorna i log ogni 10 secondi per vedere i progressi live
        const interval = setInterval(fetchRaceData, 10000);
        return () => clearInterval(interval);
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

    const handleResetTeam = async (team) => {
        const confirmText = `⚠️ ATTENZIONE ⚠️\n\nStai per cancellare TUTTE LE FOTO e i log di gara del Team: ${team.team_name}.\n\nQuesta operazione è IRREVERSIBILE.\nI piloti dovranno ricominciare da zero.\n\nSei SICURO?`;
        if (!confirm(confirmText)) return;

        try {
            setLoading(true);
            const memberIds = team.members.map(m => m.id);
            const { error } = await supabase.from('race_logs').delete().in('registration_id', memberIds);
            if (error) throw error;

            await fetchRaceData();
            if (onRefresh) onRefresh();
            alert(`Reset completato per il team ${team.team_name}`);
        } catch (err) {
            console.error("Errore reset:", err);
            alert("Errore reset: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestartRace = async () => {
        const result = await Swal.fire({
            title: 'RESET TOTALE GARA?',
            text: "ATTENZIONE: Questa operazione eliminerà definitivamente TUTTI i log di gara (foto, salti, validazioni) e azzererà i punteggi. Sei in MODALITÀ DEV.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4444',
            confirmButtonText: 'SÌ, RESETTA TUTTO',
            cancelButtonText: 'ANNULLA',
            background: '#111',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            // 1. Delete all race logs (photos, skips, etc)
            const { error: errLogs } = await supabase.from('race_logs').delete().neq('id', 0);
            if (errLogs) throw errLogs;

            // 2. Clear target_times from registrations to allow fresh regeneration
            const { error: errRegs } = await supabase.from('registrations')
                .update({ target_times: {}, score_caccia: 0 })
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (errRegs) throw errRegs;

            await fetchRaceData();
            if (onRefresh) onRefresh();

            Swal.fire({
                title: 'GARA RESETTATA',
                text: "Tutti i dati agonistici sono stati eliminati.",
                icon: 'success',
                background: '#111',
                color: '#fff'
            });
        } catch (err) {
            Swal.fire({ title: 'ERRORE', text: err.message, icon: 'error' });
        } finally {
            setLoading(false);
        }
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

    // ---------------------------------------------------------
    // 🧬 LOGICA AGGREGATIVA v10.16 (Pairing & Scoring)
    // ---------------------------------------------------------
    const processedTeams = React.useMemo(() => {
        // 1. Group by team_id (if CONFIRMED) or name (case-insensitive)
        const groups = {};

        registrations.forEach(r => {
            if (!r.team_name || r.team_name.toLowerCase() === 'staff') return;
            if (!r.formula_partecipazione?.startsWith('Caccia')) return;

            // Priority key: team_id, fallback to name
            const key = (r.team_id && r.team_status === 'CONFIRMED') ? r.team_id : r.team_name.toLowerCase().trim();

            if (!groups[key]) {
                groups[key] = {
                    key: key,
                    name: r.team_name,
                    color: r.card_color || 'ROSSA',
                    members: [],
                    target_times: r.target_times || {},
                    id: r.id, // reference for expansion
                    status: r.team_status || 'SINGLE'
                };
            }
            groups[key].members.push(r);
            // Collect target_times from anyone in the team who has them
            if (r.target_times && Object.keys(r.target_times).length > 0) {
                groups[key].target_times = r.target_times;
            }
        });

        // 2. Score each group & AUTO-SAVE to DB (Source of Truth)
        const teamList = Object.values(groups).map(team => {
            const memberIds = team.members.map(m => String(m.id));
            const teamLogs = logs.filter(l => memberIds.includes(String(l.registration_id)));

            let totalPenalty = 0;
            let validCount = 0;

            [1, 2, 3, 4].forEach(num => {
                const stepLogs = teamLogs.filter(l => l.photo_number === num);
                const officialLog = stepLogs.find(l => l.pilot_code === 'A' || !l.pilot_code);
                const anyLog = stepLogs[0];

                if (anyLog) {
                    validCount++;
                    // Calcolo Punteggio
                    if (officialLog && officialLog.validation_status !== 'REJECTED' && officialLog.validation_status !== 'SALTATA') {
                        // Target lookup
                        const targetTimeStr = team.target_times?.[`photo_${num}`];
                        let targetH, targetM;

                        if (targetTimeStr) {
                            [targetH, targetM] = targetTimeStr.split(':').map(Number);
                        } else {
                            // Fallback
                            const formula = team.members[0]?.formula_partecipazione || "";
                            let baseTime = "21:30";
                            if (formula.startsWith("Caccia")) baseTime = eventParams?.race_params?.start_time_caccia || "21:30";
                            [targetH, targetM] = baseTime.split(':').map(Number);
                        }

                        // CALCOLO CON TOLLERANZA MINUTO "HH:MM:00" -> "HH:MM:59"
                        const logDate = new Date(officialLog.recorded_at);

                        // Finestra Start (HH:MM:00)
                        const winStart = new Date(logDate);
                        winStart.setHours(targetH, targetM, 0, 0);

                        // Finestra End (HH:MM:59)
                        const winEnd = new Date(winStart);
                        winEnd.setSeconds(59);

                        let stepPenalty = 0;

                        if (logDate >= winStart && logDate <= winEnd) {
                            stepPenalty = 0; // ✅ DENTRO IL MINUTO = ZERO PENALITÀ
                        } else if (logDate < winStart) {
                            // Anticipo (Distanza da :00)
                            stepPenalty = Math.floor((winStart - logDate) / 1000);
                        } else {
                            // Ritardo (Distanza da :59)
                            stepPenalty = Math.floor((logDate - winEnd) / 1000);
                        }

                        totalPenalty += stepPenalty;

                    } else if (officialLog && officialLog.validation_status === 'SALTATA') {
                        const skipPenalty = eventParams?.race_params?.penalty_skipped_photo || 3600;
                        totalPenalty += skipPenalty;
                    }
                }
            });

            // 🔥 AUTO-UPDATE DB if score changed
            // Verifica lo score salvato sul PRIMO membro del team (tutti condividono lo stesso gruppo/score in teoria, o usiamo un campo team leader)
            // Utilizziamo team.members[0].score_caccia come riferimento attuale su DB
            const currentDbScore = team.members[0]?.score_caccia || 0;

            if (totalPenalty !== currentDbScore) {
                console.log(`[SYNC SCORE] Team ${team.team_name}: DB=${currentDbScore} -> CALC=${totalPenalty}. Updating...`);
                // Update Async (Fire & Forget per non bloccare UI)
                const teamIds = team.members.map(m => m.id);
                supabase.from('registrations')
                    .update({ score_caccia: totalPenalty })
                    .in('id', teamIds)
                    .then(({ error }) => {
                        if (error) console.error("Error updating score", error);
                    });
            }

            return {
                ...team,
                photoCount: validCount,
                totalScore: totalPenalty
            };
        });

        // 3. Final Sort
        return teamList.sort((a, b) => {
            if (b.photoCount !== a.photoCount) return b.photoCount - a.photoCount;
            return a.totalScore - b.totalScore;
        });
    }, [registrations, logs, eventParams]);

    const toggleExpand = (teamKey) => {
        setExpandedTeamId(expandedTeamId === teamKey ? null : teamKey);
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ color: '#00E5FF', fontSize: '2.4rem', fontWeight: 950, margin: 0, letterSpacing: '-1px' }}>CLASSIFICA & VERIFICA</h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem' }}>LIVE RANKING • PHOTO VALIDATION • TIME CHECK</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => {
                            if (confirm("⚠️ ATTENZIONE: VUOI DAVVERO RESETTARE TUTTA LA GARA?\n\n- Cancella tutti i LOG\n- Cancella tutti gli ORARI\n- Azzera i punteggi\n\nQuesta operazione è IRREVERSIBILE.")) {
                                handleRestartRace();
                            }
                        }}
                        style={{ background: 'rgba(255, 0, 0, 0.2)', color: '#ff4444', border: '1px solid #ff4444', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        ☢️ RESET GARA
                    </button>

                    <button
                        onClick={fetchRaceData}
                        disabled={loading}
                        style={{ background: '#111', color: '#00E5FF', border: '1px solid #333', padding: '12px 25px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' }}
                    >
                        {loading ? '...' : '🔄 AGGIORNA LIVE'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {processedTeams.map((team, index) => (
                    <div key={team.key} style={{ background: '#111', borderRadius: '24px', border: '1px solid #222', overflow: 'hidden' }}>

                        {/* HEADER RIGA TEAM */}
                        <div
                            onClick={() => toggleExpand(team.key)}
                            style={{
                                padding: '20px 30px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                cursor: 'pointer',
                                background: expandedTeamId === team.key ? 'rgba(255,255,255,0.02)' : 'transparent',
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
                                    {team.status === 'CONFIRMED' && <span style={{ fontSize: '0.6rem', background: '#4CAF50', color: '#000', padding: '1px 8px', borderRadius: '100px', fontWeight: 900 }}>TEAM VERIFICATO ✓</span>}
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
                                <div style={{ fontSize: '1.2rem', color: '#FFCC00', fontWeight: 900 }}>{team.photoCount} / 4</div>
                            </div>

                            <div style={{ transform: expandedTeamId === team.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', color: '#666' }}>
                                ▼
                            </div>
                        </div>

                        {/* DETTAGLIO ESPANSO (TABELLA TEMPI E FOTO) */}
                        {expandedTeamId === team.key && (
                            <div style={{ padding: '0 30px 30px 30px', borderTop: '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 15px 0' }}>
                                    <h4 style={{ color: '#00E5FF', textTransform: 'uppercase', fontSize: '0.9rem', margin: 0 }}>🔍 Dettaglio Prove & Passaggi</h4>

                                    {isDevMode && (
                                        <button
                                            onClick={() => handleResetTeam(team)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #ff4444',
                                                color: '#ff4444',
                                                padding: '5px 15px',
                                                borderRadius: '20px',
                                                fontWeight: 800,
                                                fontSize: '0.65rem',
                                                cursor: 'pointer',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            ⚠️ RESET TEAM LOGS
                                        </button>
                                    )}
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #333', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Obiettivo / Foto</th>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Orario Previsto</th>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Orario Effettivo</th>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Penalità (Sec)</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Prova Fotografica</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3, 4].map(num => {
                                                const teamMemberIds = team.members.map(m => String(m.id));
                                                const stepLogs = logs.filter(l => teamMemberIds.includes(String(l.registration_id)) && l.photo_number === num);

                                                // Log Ufficiale (A o null)
                                                const official = stepLogs.find(l => l.pilot_code === 'A' || !l.pilot_code);
                                                // Log Partner (B)
                                                const partner = stepLogs.find(l => l.pilot_code === 'B');

                                                // Visualizziamo l'ufficiale se c'è, altrimenti il partner (come referenza)
                                                const log = official || partner;
                                                const isPartnerRef = !official && partner;

                                                // SOURCE OF TRUTH: target_times from team group
                                                let targetTimeStr = "--:--";
                                                let targetH = 21, targetM = 30; // defaults

                                                if (team.target_times?.[`photo_${num}`]) {
                                                    targetTimeStr = team.target_times[`photo_${num}`].substring(0, 5);
                                                    [targetH, targetM] = targetTimeStr.split(':').map(Number);
                                                } else {
                                                    // Fallback
                                                    const formula = team.members[0]?.formula_partecipazione || "";
                                                    let baseTime = "21:30";
                                                    if (formula.startsWith("Caccia")) baseTime = eventParams?.race_params?.start_time_caccia || "21:30";
                                                    targetTimeStr = baseTime;
                                                    [targetH, targetM] = baseTime.split(':').map(Number);
                                                }

                                                const actualTimeStr = log ? new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';

                                                let diffStr = "--";
                                                let diffColor = "#666";

                                                if (log && log.recorded_at) {
                                                    const logDate = new Date(log.recorded_at);
                                                    // Finestra Start (HH:MM:00)
                                                    const winStart = new Date(logDate);
                                                    winStart.setHours(targetH, targetM, 0, 0);

                                                    // Finestra End (HH:MM:59)
                                                    const winEnd = new Date(winStart);
                                                    winEnd.setSeconds(59);

                                                    let stepPenalty = 0;

                                                    if (logDate >= winStart && logDate <= winEnd) {
                                                        stepPenalty = 0;
                                                        diffStr = "OK";
                                                        diffColor = "#4CAF50";
                                                    } else if (logDate < winStart) {
                                                        stepPenalty = Math.floor((winStart - logDate) / 1000);
                                                        diffStr = `-${stepPenalty}`;
                                                        diffColor = "#FFCC00";
                                                    } else {
                                                        stepPenalty = Math.floor((logDate - winEnd) / 1000);
                                                        diffStr = `+${stepPenalty}`;
                                                        diffColor = "#ff4444";
                                                    }
                                                }

                                                // 🧬 Se è un log del Partner (senza ufficiale), visualizziamo comunque in arancione
                                                if (isPartnerRef && log) {
                                                    diffColor = '#FF9800';
                                                    diffStr += ' (Ref)';
                                                }

                                                return (
                                                    <tr key={num} style={{ borderBottom: '1px solid #222' }}>
                                                        <td style={{ padding: '15px', fontWeight: 900, color: '#fff' }}>
                                                            STEP {num}
                                                        </td>
                                                        <td style={{ padding: '15px' }}>
                                                            <div style={{ color: '#fff', fontWeight: 900 }}>{targetTimeStr}</div>
                                                        </td>
                                                        <td style={{ padding: '15px' }}>
                                                            <div style={{ color: isPartnerRef ? '#FF9800' : '#00E5FF', fontFamily: 'monospace' }}>{actualTimeStr}</div>
                                                            {isPartnerRef && <div style={{ fontSize: '0.6rem', color: '#FF9800', fontWeight: 900 }}>PARTNER (BOZZA)</div>}
                                                        </td>
                                                        <td style={{ padding: '15px', color: isPartnerRef ? '#FF9800' : diffColor, fontWeight: 900, fontFamily: 'monospace' }}>
                                                            {isPartnerRef ? (log ? diffStr : '--') : diffStr}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                            {log ? (
                                                                <div
                                                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                                                    onClick={() => setSelectedPhoto({ log, team, photoNum: num })}
                                                                >
                                                                    {log.photo_url ? (
                                                                        <div style={{ position: 'relative' }}>
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
                                                                        <div style={{ padding: '15px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#ff4444', fontSize: '0.65rem', fontWeight: 950, border: '1px solid #333', textAlign: 'center' }}>
                                                                            🚫 SALTATA
                                                                        </div>
                                                                    )}
                                                                    <div style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900 }}>CLICCA PER GESTIRE</div>
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

                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '60vh', borderRadius: '30px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 50px 100px rgba(0,0,0,0.8)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPhoto.log.photo_url ? (
                            <img
                                src={selectedPhoto.log.photo_url}
                                style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block' }}
                                alt="Full Preview"
                            />
                        ) : (
                            <div style={{ padding: '100px', textAlign: 'center', color: '#444' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📷</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>Foto o Documento non presente</div>
                                <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>(Segnato manualmente come saltato)</div>
                            </div>
                        )}
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
                        >ELIMINA FOTO</button>
                    </div>
                </div>
            )}
        </div>
    );
}
