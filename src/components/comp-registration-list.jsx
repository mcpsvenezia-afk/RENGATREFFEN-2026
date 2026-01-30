/**
 * 🧬 COMPONENT: Registration List Table
 * Goal: Display detailed registrations with many columns
 */

import React from 'react';

export function RegistrationList({ data, onSelect, onInspect, onDelete, isDevMode }) {
    const tdStyle = { padding: '15px', fontSize: '0.85rem', whiteSpace: 'nowrap' };
    const thStyle = { padding: '15px', textAlign: 'left', fontSize: '0.7rem', color: '#8d8d8d', textTransform: 'uppercase', letterSpacing: '1px' };

    return (
        <div data-component="RegistrationList" style={{ overflowX: 'auto', backgroundColor: '#262626', borderRadius: '8px', border: '1px solid #393939' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#1a1a1a' }}>
                        <th style={thStyle}>Team</th>
                        <th style={thStyle}>Pilota</th>
                        <th style={thStyle}>Email / Tel</th>
                        <th style={thStyle}>Moto</th>
                        <th style={thStyle}>MCPS</th>
                        <th style={thStyle}>Fango</th>
                        <th style={thStyle}>Data</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(reg => (
                        <tr
                            key={reg.id}
                            onClick={(e) => {
                                onSelect(reg);
                                if (isDevMode && (e.ctrlKey || e.metaKey)) onInspect(reg);
                            }}
                            style={{
                                borderBottom: '1px solid #333',
                                cursor: 'pointer',
                                transition: '0.2s',
                                backgroundColor: reg.stato_iscrizione === 'Lista_Attesa' ? 'rgba(230,0,126,0.15)' :
                                    reg.stato_iscrizione === 'In_Valutazione' ? 'rgba(255,165,0,0.15)' : 'transparent'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = reg.stato_iscrizione === 'Lista_Attesa' ? 'rgba(230,0,126,0.25)' :
                                reg.stato_iscrizione === 'In_Valutazione' ? 'rgba(255,165,0,0.25)' : '#2d2d2d'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = reg.stato_iscrizione === 'Lista_Attesa' ? 'rgba(230,0,126,0.15)' :
                                reg.stato_iscrizione === 'In_Valutazione' ? 'rgba(255,165,0,0.15)' : 'transparent'}
                        >
                            <td style={tdStyle}>
                                <span style={{ color: '#FFCC00', fontWeight: 'bold' }}>{reg.team_name}</span>
                                <br />
                                <small style={{ color: '#888', fontSize: '0.7rem' }}>{reg.team_role}</small>
                            </td>
                            <td style={tdStyle}>{reg.nome} {reg.cognome}</td>
                            <td style={tdStyle}>
                                <div style={{ fontSize: '0.8rem' }}>{reg.email}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{reg.telefono}</div>
                            </td>
                            <td style={tdStyle}>{reg.moto_details || reg.moto}</td>
                            <td style={tdStyle}>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: reg.is_mcps_member === 'SI' ? 'rgba(255, 204, 0, 0.1)' : 'transparent',
                                    color: reg.is_mcps_member === 'SI' ? '#FFCC00' : '#888',
                                    border: reg.is_mcps_member === 'SI' ? '1px solid #FFCC00' : '1px solid #444'
                                }}>
                                    {reg.is_mcps_member || 'N/D'}
                                </span>
                            </td>
                            <td style={tdStyle}>
                                <span style={{ color: reg.is_fango_tours_member === 'SI' ? '#4CAF50' : '#888' }}>
                                    {reg.is_fango_tours_member === 'SI' ? 'Tesserato' : 'No'}
                                </span>
                            </td>
                            <td style={tdStyle}>{new Date(reg.created_at).toLocaleDateString()}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Sei sicuro di voler eliminare l'iscrizione di ${reg.nome} ${reg.cognome}?`)) {
                                            onDelete(reg.id);
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#E6007E',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        transition: '0.3s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(230,0,126,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    title="Elimina Iscrizione"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
