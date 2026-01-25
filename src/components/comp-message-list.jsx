/**
 * 🧬 COMPONENT: Message List Table v2.0
 * Features: Attachment indicator, compact columns, more info
 */

import React from 'react';

export function MessageList({ data, onSelect, onInspect, isDevMode }) {
    const thStyle = { padding: '12px 10px', textAlign: 'left', fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '1px' };
    const tdStyle = { padding: '14px 10px', fontSize: '0.85rem', verticalAlign: 'middle' };

    return (
        <div style={{ backgroundColor: '#0a0a0a', borderRadius: '16px', border: '1px solid #222', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111', borderBottom: '2px solid #222' }}>
                        <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>📎</th>
                        <th style={thStyle}>Mittente</th>
                        <th style={{ ...thStyle, width: '35%' }}>Messaggio</th>
                        <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Stato</th>
                        <th style={{ ...thStyle, width: '100px' }}>Data</th>
                        <th style={{ ...thStyle, width: '80px' }}>Ora</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(msg => (
                        <tr
                            key={msg.id}
                            onClick={(e) => {
                                onSelect(msg);
                                if (isDevMode && (e.ctrlKey || e.metaKey)) onInspect(msg);
                            }}
                            style={{ borderBottom: '1px solid #1a1a1a', transition: '0.2s', cursor: 'pointer' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#111'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <td style={{ ...tdStyle, textAlign: 'center', fontSize: '1.1rem' }}>
                                {msg.has_attachments ? '📎' : ''}
                            </td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{msg.name}</div>
                                <div style={{ color: '#00E5FF', fontSize: '0.75rem' }}>{msg.email}</div>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#aaa' }}>
                                    {msg.message}
                                </div>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    background: msg.status === 'Archiviato' ? '#333' : 'rgba(0,229,255,0.1)',
                                    color: msg.status === 'Archiviato' ? '#666' : '#00E5FF',
                                    border: msg.status === 'Archiviato' ? '1px solid #444' : '1px solid rgba(0,229,255,0.3)'
                                }}>
                                    {msg.status || 'Nuovo'}
                                </span>
                            </td>
                            <td style={{ ...tdStyle, color: '#888', fontSize: '0.8rem' }}>
                                {new Date(msg.created_at).toLocaleDateString('it-IT')}
                            </td>
                            <td style={{ ...tdStyle, color: '#555', fontSize: '0.75rem' }}>
                                {new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
