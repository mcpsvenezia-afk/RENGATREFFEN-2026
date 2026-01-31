/**
 * 🧬 COMPONENTE: Tabella Lista Iscrizioni
 * Obiettivo: Visualizzare iscrizioni dettagliate con diverse colonne
 */

import React from 'react';

// Helper for team colors
const getTeamColor = (name) => {
    if (!name || name.toLowerCase() === 'staff') return 'transparent';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsla(${h}, 70%, 20%, 0.3)`;
};

export function RegistrationList({ data, onSelect, onInspect, onDelete, isDevMode }) {
    const tdStyle = { padding: '15px', fontSize: '1rem', whiteSpace: 'nowrap', fontWeight: 500 };
    const thStyle = { padding: '15px', textAlign: 'left', fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900 };

    return (
        <div
            data-component="RegistrationList"
            data-dna="1200-REGISTRATION-TABLE"
            style={{ overflowX: 'auto', backgroundColor: '#000', borderRadius: '24px', border: '1px solid #333' }}
        >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111', borderBottom: '2px solid #222' }}>
                        <th style={{ ...thStyle, width: '80px' }}># GARA</th>
                        <th style={{ ...thStyle, width: '100px' }}>PARTENZA</th>
                        <th style={thStyle}>FORMULA</th>
                        <th style={thStyle}>TEAM</th>
                        <th style={thStyle}>PILOTA</th>
                        <th style={thStyle}>EMAIL/CELL</th>
                        <th style={thStyle}>MOTO/TARGA</th>
                        <th style={thStyle}>MCPS</th>
                        <th className="no-print" style={{ ...thStyle, textAlign: 'center' }}>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(reg => {
                        const teamBg = getTeamColor(reg.team_name);
                        const isStaff = (reg.team_name || '').toLowerCase() === 'staff';

                        return (
                            <tr
                                key={reg.id}
                                data-dna={`ROW-ID-${reg.id}`}
                                onClick={(e) => {
                                    onSelect(reg);
                                    if (isDevMode && (e.ctrlKey || e.metaKey)) onInspect(reg);
                                }}
                                style={{
                                    borderBottom: '1px solid #222',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    backgroundColor: isStaff ? 'rgba(0, 229, 255, 0.1)' : teamBg
                                }}
                                onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.5)'}
                                onMouseOut={e => e.currentTarget.style.filter = 'none'}
                            >
                                <td style={{ ...tdStyle, color: '#FFCC00', fontWeight: 900, fontSize: '1.4rem' }}>
                                    {reg.bib_number || '--'}
                                </td>
                                <td style={{ ...tdStyle, color: '#fff', fontWeight: 800 }}>
                                    {reg.departure_time || '--:--'}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '100px',
                                        fontSize: '0.75rem',
                                        fontWeight: 900,
                                        backgroundColor: reg.formula_partecipazione === '4x4' ? '#FF6D00' :
                                            reg.formula_partecipazione === 'Discovery' ? '#FF9100' : '#4CAF50',
                                        color: '#000'
                                    }}>
                                        {reg.formula_partecipazione?.replace('_', ' ') || 'N/D'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>{reg.team_name}</span>
                                    <br />
                                    <small style={{ color: '#888', fontSize: '0.7rem' }}>{reg.team_role}</small>
                                </td>
                                <td style={tdStyle}>{reg.nome} {reg.cognome}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{reg.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{reg.telefono}</div>
                                </td>
                                <td style={tdStyle}>{reg.moto_details || reg.moto}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: reg.is_mcps_member === 'SI' ? 'rgba(255, 204, 0, 0.1)' : 'transparent',
                                        color: reg.is_mcps_member === 'SI' ? '#FFCC00' : '#888',
                                        border: reg.is_mcps_member === 'SI' ? '1px solid #FFCC00' : '1px solid #444',
                                        fontSize: '0.7rem'
                                    }}>
                                        MCPS: {reg.is_mcps_member || 'NO'}
                                    </span>
                                </td>
                                <td className="no-print" style={{ ...tdStyle, textAlign: 'center' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Eliminare ${reg.nome} ${reg.cognome}?`)) onDelete(reg.id);
                                        }}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
