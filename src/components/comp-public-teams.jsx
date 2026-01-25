/**
 * 🧬 COMPONENT: Public Dynamic Team List v1.0
 * Goal: Render verified (paid) teams with pilots, bios and numbers.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function PublicTeamList() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVerifiedTeams();
    }, []);

    async function fetchVerifiedTeams() {
        try {
            // Fetch only paid registrations
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .eq('is_paid', 'SI')
                .order('team_name', { ascending: true });

            if (error) throw error;

            // Group by Team Name
            const grouped = data.reduce((acc, current) => {
                const name = current.team_name || 'Team Senza Nome';
                if (!acc[name]) acc[name] = [];
                acc[name].push(current);
                return acc;
            }, {});

            // Convert to array and Sort by bib_number
            const teamsArray = Object.keys(grouped).map(name => ({
                name,
                pilots: grouped[name],
                bib: grouped[name][0].bib_number || '??'
            })).sort((a, b) => a.bib.localeCompare(b.bib));

            setTeams(teamsArray);
        } catch (err) {
            console.error('Error fetching teams:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#FFCC00', fontWeight: 900, fontSize: '1.5rem' }}>CARICAMENTO TEAM...</div>;

    if (teams.length === 0) return (
        <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px dashed #333' }}>
            <h3 style={{ color: '#666', fontSize: '1.5rem' }}>Nessun team confermato al momento.</h3>
            <p style={{ color: '#444', marginTop: '10px' }}>Le iscrizioni sono in corso!</p>
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: '40px' }}>
            {teams.map((team, idx) => (
                <div key={idx} style={teamCardStyle}>
                    <div style={teamHeaderStyle}>
                        <h3 style={teamTitleStyle}>🏆 Team {team.name}</h3>
                        <div style={badgeStyle}>#{team.bib}</div>
                    </div>

                    <div style={pilotsGridStyle}>
                        {team.pilots.map((pilot, pIdx) => (
                            <PilotCard
                                key={pIdx}
                                pilot={pilot}
                                suffix={pilot.team_role?.toLowerCase() === 'capitano' ? 'A' : 'B'}
                            />
                        ))}
                        {/* Placeholder if team has only 1 pilot registered/paid */}
                        {team.pilots.length === 1 && (
                            <div style={pilotPlaceholderStyle}>
                                <div style={emptyAvatarStyle}>?</div>
                                <div>
                                    <h4 style={{ color: '#333', margin: 0 }}>In attesa...</h4>
                                    <p style={{ color: '#222', fontSize: '0.8rem' }}>Il partner non ha ancora completato l'iscrizione.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PilotCard({ pilot, suffix }) {
    const [expanded, setExpanded] = useState(false);
    const bioText = pilot.pilot_bio || 'Nessuna biografia inserita.';
    const isLong = bioText.length > 120;
    const displayBio = expanded ? bioText : bioText.substring(0, 120) + (isLong ? '...' : '');

    return (
        <div style={pilotContainerStyle}>
            <div style={avatarWrapperStyle}>
                {pilot.pilot_photo ? (
                    <img src={pilot.pilot_photo} alt={pilot.nome} style={avatarImgStyle} />
                ) : (
                    <div style={avatarFallbackStyle}>👤</div>
                )}
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={pilotNameStyle}>{pilot.nome} {pilot.cognome} <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', marginLeft: '5px' }}>#{pilot.bib_number}{suffix}</span></h4>
                <div style={roleTagStyle}>{pilot.team_role?.toUpperCase() || 'PILOTA'}</div>
                <p style={bioStyle}>
                    {displayBio}
                    {isLong && (
                        <span onClick={() => setExpanded(!expanded)} style={readMoreStyle}>
                            {expanded ? ' Leggi meno' : ' Leggi altro'}
                        </span>
                    )}
                </p>
                {pilot.departure_time && (
                    <div style={timeTagStyle}>⏱ Partenza: {pilot.departure_time}</div>
                )}
            </div>
        </div>
    );
}

// STYLES
const teamCardStyle = {
    background: 'rgba(15, 15, 25, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '40px',
    padding: '40px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
};

const teamHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '20px'
};

const teamTitleStyle = {
    fontSize: '2rem',
    fontWeight: 900,
    color: '#FFCC00',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const badgeStyle = {
    background: '#E6007E',
    color: '#fff',
    padding: '10px 25px',
    borderRadius: '50px',
    fontWeight: 900,
    fontSize: '1.2rem',
    boxShadow: '0 0 20px rgba(230, 0, 126, 0.3)'
};

const pilotsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '40px'
};

const pilotContainerStyle = {
    display: 'flex',
    gap: '25px',
    alignItems: 'flex-start'
};

const avatarWrapperStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid rgba(255,204,0,0.3)',
    flexShrink: 0,
    backgroundColor: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const avatarImgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
};

const avatarFallbackStyle = {
    fontSize: '3rem',
    opacity: 0.3
};

const pilotNameStyle = {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: '#fff',
    margin: '0 0 5px 0'
};

const roleTagStyle = {
    color: '#E6007E',
    fontSize: '0.75rem',
    fontWeight: 900,
    letterSpacing: '2px',
    marginBottom: '15px'
};

const bioStyle = {
    color: '#aaa',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    margin: 0
};

const readMoreStyle = {
    color: '#FFCC00',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.85rem'
};

const timeTagStyle = {
    display: 'inline-block',
    marginTop: '15px',
    backgroundColor: 'rgba(255,204,0,0.1)',
    color: '#FFCC00',
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 700
};

const pilotPlaceholderStyle = {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    opacity: 0.3,
    background: 'rgba(0,0,0,0.1)',
    padding: '20px',
    borderRadius: '24px'
};

const emptyAvatarStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px dashed #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    color: '#444'
};
