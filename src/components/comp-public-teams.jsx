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
                // Ensure Captain is ALWAYS first (Left position)
                const sortedPilots = [...grouped[name]].sort((a, b) => {
                    if (a.team_role?.toLowerCase() === 'capitano') return -1;
                    if (b.team_role?.toLowerCase() === 'capitano') return 1;
                    return 0;
                });

                return {
                    name,
                    pilots: sortedPilots,
                    bib: sortedPilots[0].bib_number || '??',
                    departure: sortedPilots[0].departure_time || '--:--'
                };
            }).sort((a, b) => a.bib.localeCompare(b.bib));

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
        <div style={{ display: 'grid', gap: '60px' }}>
            {teams.map((team, idx) => (
                <div key={idx} style={teamCardStyle}>
                    <div style={teamHeaderStyle}>
                        <h3 style={teamTitleStyle}>🏆 TEAM {team.name}</h3>
                        <div style={badgeStyle}>
                            {team.departure}
                        </div>
                    </div>

                    <div style={pilotsGridStyle}>
                        {team.pilots.map((pilot, pIdx) => (
                            <PilotCard
                                key={pIdx}
                                pilot={pilot}
                                suffix={pilot.team_role?.toLowerCase() === 'capitano' ? 'A' : 'B'}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PilotCard({ pilot, suffix }) {
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
                    {pilot.nome?.toUpperCase()} {pilot.cognome?.toUpperCase()}
                    <span style={suffixStyle}>#{suffix}</span>
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
    borderRadius: '40px',
    padding: '50px',
    position: 'relative',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6)'
};

const teamHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '50px',
    borderBottom: '1px solid #1a1a1a',
    paddingBottom: '25px'
};

const teamTitleStyle = {
    fontSize: '2.4rem',
    fontWeight: 900,
    color: '#FFCC00',
    margin: 0,
    letterSpacing: '1px'
};

const badgeStyle = {
    background: '#E6007E',
    color: '#fff',
    padding: '12px 30px',
    borderRadius: '50px',
    fontWeight: 900,
    fontSize: '1.5rem',
    boxShadow: '0 10px 30px rgba(230, 0, 126, 0.4)'
};

const pilotsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '60px'
};

const pilotContainerStyle = {
    display: 'flex',
    gap: '35px',
    alignItems: 'flex-start'
};

const avatarWrapperStyle = {
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '5px solid #FFCC00',
    flexShrink: 0,
    backgroundColor: '#000',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
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
    fontSize: '1.8rem',
    fontWeight: 900,
    color: '#fff',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
};

const suffixStyle = {
    color: 'rgba(255,255,255,0.15)',
    fontSize: '1.1rem',
    fontWeight: 900
};

const roleTagStyle = {
    color: '#E6007E',
    fontSize: '0.8rem',
    fontWeight: 900,
    letterSpacing: '3px',
    marginBottom: '20px'
};

const bioStyle = {
    color: '#999',
    fontSize: '1.1rem',
    lineHeight: '1.7',
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
