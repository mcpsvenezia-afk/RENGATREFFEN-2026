/**
 * 🧬 COMPONENT: Public Dynamic Team List v1.1
 * Goal: Optimized Pilot Order (Captain Left), Suffix Sync, and High Vis Names.
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
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .eq('is_paid', 'SI')
                .order('team_name', { ascending: true });

            if (error) throw error;

            const grouped = data.reduce((acc, current) => {
                const name = current.team_name || 'Team Senza Nome';
                if (!acc[name]) acc[name] = [];
                acc[name].push(current);
                return acc;
            }, {});

            const teamsArray = Object.keys(grouped).map(name => {
                const pilots = grouped[name];
                // 🧬 TEAM-WIDE BIB SYNC: If any record for this team has a bib_number, use it as base
                const teamBib = pilots.find(p => p.bib_number)?.bib_number?.replace(/[A-Za-z]/g, '') || '';

                const sortedPilots = [...pilots].sort((a, b) => {
                    if (a.team_role?.toLowerCase() === 'capitano') return -1;
                    if (b.team_role?.toLowerCase() === 'capitano') return 1;
                    return 0;
                });

                return {
                    name,
                    pilots: sortedPilots,
                    bib: teamBib,
                    departure: sortedPilots[0].departure_time || '--:--'
                };
            }).sort((a, b) => {
                const numA = parseInt(a.bib) || 999;
                const numB = parseInt(b.bib) || 999;
                return numA - numB;
            });

            setTeams(teamsArray);
        } catch (err) {
            console.error('Error fetching teams:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#FFCC00', fontWeight: 900, fontSize: '1.5rem' }}>CARICAMENTO TEAM...</div>;

    if (teams.length === 0) return (
        <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px dashed #FFCC00' }}>
            <h3 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 900 }}>Nessun team confermato al momento.</h3>
            <p style={{ color: '#FFCC00', marginTop: '15px', fontSize: '1.1rem', fontWeight: 700 }}>Le iscrizioni sono in corso!</p>
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: '60px' }}>
            {teams.map((team, idx) => (
                <div key={idx} style={teamCardStyle}>
                    <div style={teamHeaderStyle}>
                        <h3 style={teamTitleStyle}>🏆 TEAM {team.name} <span style={{ fontSize: '0.6rem', opacity: 0.2, verticalAlign: 'middle' }}>v1.1.4</span></h3>
                        <div style={badgeStyle}>
                            START {team.departure}
                        </div>
                    </div>

                    <div style={pilotsGridStyle}>
                        {team.pilots.map((pilot, pIdx) => (
                            <PilotCard
                                key={pIdx}
                                pilot={pilot}
                                bib={team.bib}
                                suffix={pilot.team_role?.toLowerCase() === 'capitano' ? 'A' : 'B'}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PilotCard({ pilot, bib, suffix }) {
    const [expanded, setExpanded] = useState(false);
    const bioText = pilot.pilot_bio || 'Nessuna biografia inserita.';
    const isLong = bioText.length > 140;
    const displayBio = expanded ? bioText : bioText.substring(0, 140) + (isLong ? '...' : '');

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
                <h4 style={pilotNameStyle}>
                    <span style={{ flex: 1 }}>{pilot.nome?.toUpperCase()} {pilot.cognome?.toUpperCase()}</span>
                    <span style={suffixStyle}>#{pilot.bib_number ?? (bib ? `${bib}${suffix}` : suffix)}</span>
                </h4>
                <div style={roleTagStyle}>{pilot.team_role?.toUpperCase() || 'PILOTA'}</div>

                <p style={bioStyle}>
                    {displayBio}
                    {isLong && (
                        <span onClick={() => setExpanded(!expanded)} style={readMoreStyle}>
                            {expanded ? ' Leggi meno' : ' Leggi altro'}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

// PREMIUM STYLES
const teamCardStyle = {
    background: '#09090b',
    border: '1px solid #222',
    borderRadius: '30px',
    padding: '35px',
    position: 'relative',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)'
};

const teamHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '35px',
    borderBottom: '1px solid #1a1a1a',
    paddingBottom: '20px'
};

const teamTitleStyle = {
    fontSize: '1.7rem',
    fontWeight: 900,
    color: '#FFCC00',
    margin: 0,
    letterSpacing: '0.5px'
};

const badgeStyle = {
    background: '#E6007E',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '50px',
    fontWeight: 900,
    fontSize: '1.1rem',
    boxShadow: '0 8px 25px rgba(230, 0, 126, 0.4)'
};

const pilotsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '40px'
};

const pilotContainerStyle = {
    display: 'flex',
    gap: '25px',
    alignItems: 'flex-start'
};

const avatarWrapperStyle = {
    width: '125px',
    height: '125px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid #FFCC00',
    flexShrink: 0,
    backgroundColor: '#000',
    boxShadow: '0 15px 30px rgba(0,0,0,0.5)'
};

const avatarImgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
};

const avatarFallbackStyle = {
    fontSize: '4rem',
    opacity: 0.1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'
};

const pilotNameStyle = {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: '#FFFFFF',
    margin: '0 0 5px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
};

const suffixStyle = {
    color: '#FFFFFF', // Pure White for MAX Contrast
    fontSize: '1.8rem',
    fontWeight: 900,
    marginLeft: 'auto',
    opacity: 1,
    textShadow: '0 0 15px rgba(255,204,0,0.8)', // Gold Glow
    fontFamily: 'var(--font-display)',
    letterSpacing: '-1px'
};

const roleTagStyle = {
    color: '#E6007E',
    fontSize: '0.7rem',
    fontWeight: 900,
    letterSpacing: '2px',
    marginBottom: '15px'
};

const bioStyle = {
    color: '#999',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    margin: 0
};

const readMoreStyle = {
    color: '#FFCC00',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: '0.9rem',
    marginLeft: '10px'
};

const timeTagStyle = {
    display: 'inline-block',
    marginTop: '25px',
    backgroundColor: 'rgba(255,204,0,0.05)',
    color: '#FFCC00',
    padding: '8px 20px',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 900,
    border: '1px solid rgba(255,204,0,0.2)'
};
