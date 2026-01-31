import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RankingsTab({ registrations, onRefresh }) {
    const [scores, setScores] = useState({});
    const [loading, setLoading] = useState(false);

    // Group by team and extract unique teams that are "Caccia" or "4x4"
    const teams = Array.from(new Set(registrations
        .filter(r => r.team_name && r.team_name.toLowerCase() !== 'staff')
        .map(r => r.team_name)
    )).sort();

    useEffect(() => {
        // Initialize scores state from registrations data
        const initialScores = {};
        registrations.forEach(r => {
            if (r.team_name) {
                // We assume all members of a team have the same score or we just take the first found
                if (initialScores[r.team_name] === undefined || (r.score_caccia || 0) > initialScores[r.team_name]) {
                    initialScores[r.team_name] = r.score_caccia || 0;
                }
            }
        });
        setScores(initialScores);
    }, [registrations]);

    async function handleUpdateScore(teamName, newScore) {
        setLoading(true);
        try {
            const val = parseInt(newScore) || 0;
            // Update all registrations for this team
            const { error } = await supabase
                .from('registrations')
                .update({ score_caccia: val })
                .eq('team_name', teamName);

            if (error) throw error;

            setScores(prev => ({ ...prev, [teamName]: val }));
            onRefresh(); // Refresh global data
        } catch (err) {
            console.error('Error updating score:', err);
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    const sortedTeams = teams.map(name => ({
        name,
        score: scores[name] || 0,
        members: registrations.filter(r => r.team_name === name).length
    })).sort((a, b) => b.score - a.score);

    return (
        <div data-dna="RANKINGS-PANEL" style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h2 style={{ color: '#00E5FF', fontSize: '2rem', fontWeight: 900, margin: 0 }}>CLASSIFICA CACCIA AL TESORO</h2>
                <div style={{ backgroundColor: '#111', padding: '10px 20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 900 }}>TEAM TOTALI: {teams.length}</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sortedTeams.map((team, index) => (
                    <div
                        key={team.name}
                        style={{
                            background: index === 0 ? 'rgba(0, 229, 255, 0.05)' : '#111',
                            padding: '20px 30px',
                            borderRadius: '24px',
                            border: `1px solid ${index === 0 ? '#00E5FF' : '#333'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            transition: '0.3s'
                        }}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: index < 3 ? (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') : '#222',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            color: index < 3 ? '#000' : '#888',
                            fontSize: '1.2rem'
                        }}>
                            {index + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>{team.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{team.members} MEMBRI</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#888' }}>PUNTEGGIO:</span>
                            <input
                                type="number"
                                value={team.score}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setScores(prev => ({ ...prev, [team.name]: val }));
                                }}
                                onBlur={(e) => handleUpdateScore(team.name, e.target.value)}
                                style={{
                                    width: '100px',
                                    background: '#000',
                                    border: '1px solid #444',
                                    color: '#00E5FF',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    fontSize: '1.2rem',
                                    fontWeight: 900,
                                    textAlign: 'center',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                ))}

                {teams.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '100px', color: '#444', fontWeight: 900, fontSize: '1.5rem' }}>
                        NESSUN TEAM REGISTRATO
                    </div>
                )}
            </div>
        </div>
    );
}
