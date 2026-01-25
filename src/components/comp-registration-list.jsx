/**
 * 🧬 COMPONENT: Registration List Table
 * Goal: Display detailed registrations with many columns
 */

import React from 'react';

export function RegistrationList({ data, onSelect, onInspect, isDevMode }) {
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
                            style={{ borderBottom: '1px solid #333', cursor: 'pointer', transition: '0.2s' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
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
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
