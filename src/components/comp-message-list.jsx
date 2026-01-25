/**
 * 🧬 COMPONENT: Message List Table
 * Goal: Display contact messages
 */

import React from 'react';

export function MessageList({ data, onSelect, onInspect, isDevMode }) {
    const tdStyle = { padding: '18px', fontSize: '0.9rem' };
    const thStyle = { padding: '18px', textAlign: 'left', fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase' };

    return (
        <div style={{ backgroundColor: '#262626', borderRadius: '8px', border: '1px solid #393939', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#1a1a1a' }}>
                        <th style={thStyle}>Mittente</th>
                        <th style={thStyle}>Messaggio</th>
                        <th style={thStyle}>Stato</th>
                        <th style={thStyle}>Data</th>
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
                            style={{ borderBottom: '1px solid #393939', transition: '0.2s', cursor: 'pointer' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <td style={tdStyle}>
                                <strong>{msg.name}</strong><br />
                                <small style={{ color: '#8d8d8d' }}>{msg.email}</small>
                            </td>
                            <td style={tdStyle}>
                                <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {msg.message}
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <span style={{
                                    color: msg.status === 'Archiviato' ? '#888' : '#00E5FF',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {msg.status || 'Nuovo'}
                                </span>
                            </td>
                            <td style={tdStyle}>{new Date(msg.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
