/**
 * 🧬 COMPONENTE: Tabella Lista Iscrizioni
 * Obiettivo: Visualizzare iscrizioni dettagliate con diverse colonne
 */

import React from 'react';
import { TeamPairingIndicator } from './comp-team-status-badge';

// Helper for team colors - usa team_id per accoppiare i colori
const getTeamColor = (teamId, teamStatus) => {
    // Team singoli o senza team_id: sfondo trasparente
    if (!teamId || teamStatus === 'SINGLE') return 'rgba(255, 255, 255, 0.02)';

    // Team accoppiati: genera colore basato su team_id
    let hash = 0;
    const idStr = teamId.toString();
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsla(${h}, 60%, 15%, 0.4)`;
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
                        <th className="no-print" style={{ ...thStyle, width: '60px', textAlign: 'center' }}></th>
                        <th style={{ ...thStyle, width: '80px' }}># GARA</th>
                        <th style={{ ...thStyle, width: '100px' }}>PARTENZA</th>
                        <th style={thStyle}>FORMULA</th>
                        <th style={thStyle}>TEAM</th>
                        <th style={thStyle}>STATUS</th>
                        <th style={thStyle}>PILOTA</th>
                        <th style={thStyle}>EMAIL/CELL</th>
                        <th style={thStyle}>MOTO/TARGA</th>
                        <th style={thStyle}>MCPS</th>
                    </tr>
                </thead>
                <tbody>
                    {data
                        // 🔄 ORDINAMENTO: Prima CONFIRMED (per team_id), poi PENDING, poi SINGLE
                        .sort((a, b) => {
                            const statusOrder = { 'CONFIRMED': 1, 'PENDING': 2, 'SINGLE': 3 };
                            const aOrder = statusOrder[a.team_status] || 4;
                            const bOrder = statusOrder[b.team_status] || 4;

                            if (aOrder !== bOrder) return aOrder - bOrder;

                            // Se stesso status, ordina per team_id (così i team accoppiati stanno vicini)
                            if (a.team_id && b.team_id) {
                                return a.team_id.localeCompare(b.team_id);
                            }

                            // Altrimenti ordina per nome team
                            return (a.team_name || '').localeCompare(b.team_name || '');
                        })
                        .map(reg => {
                            const teamBg = getTeamColor(reg.team_id, reg.team_status);
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
                                    <td className="no-print" style={{ ...tdStyle, textAlign: 'center', width: '60px' }}>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const result = await Swal.fire({
                                                    title: 'ELIMINA ISCRIZIONE?',
                                                    text: `Sei sicuro di voler eliminare ${reg.nome} ${reg.cognome}?`,
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#E6007E',
                                                    cancelButtonColor: '#333',
                                                    confirmButtonText: 'SÌ, ELIMINA',
                                                    cancelButtonText: 'ANNULLA',
                                                    background: '#111',
                                                    color: '#fff'
                                                });
                                                if (result.isConfirmed) onDelete(reg.id);
                                            }}
                                            style={{
                                                border: 'none',
                                                background: 'rgba(230, 0, 126, 0.1)',
                                                color: '#E6007E',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                transition: '0.2s'
                                            }}
                                            onMouseOver={e => {
                                                e.currentTarget.style.background = '#E6007E';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseOut={e => {
                                                e.currentTarget.style.background = 'rgba(230, 0, 126, 0.1)';
                                                e.currentTarget.style.color = '#E6007E';
                                            }}
                                            title="Elimina"
                                        >
                                            🗑️
                                        </button>
                                    </td>
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
                                    <td style={tdStyle}>
                                        <TeamPairingIndicator registration={reg} />
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
                                </tr>
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
}
