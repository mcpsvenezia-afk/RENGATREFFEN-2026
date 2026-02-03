/**
 * 🧬 COMPONENT: Team Status Badge
 * Purpose: Visual indicator for team pairing status
 * Features: Green (PAIRED), Orange (PENDING), Red (SINGLE)
 */

import React from 'react';

export function TeamStatusBadge({ status, teamId, partnerName }) {
    const getStatusConfig = () => {
        // Normalizziamo lo stato per evitare problemi di Case Sensitivity
        const s = (status || '').toUpperCase();

        if (s === 'CONFIRMED' || s === 'PAIRED' || teamId) {
            return {
                color: '#4CAF50',
                icon: '🏁',
                label: 'TEAM OK',
                tooltip: `Team completo${partnerName ? ` con ${partnerName}` : ''}`
            };
        }

        if (s === 'PENDING') {
            return {
                color: '#FF9800',
                icon: '⏳',
                label: 'PENDENTE',
                tooltip: 'Partner indicato non ha ancora ricambiato'
            };
        }

        return {
            color: '#F44336',
            icon: '👤',
            label: 'LUPO SOLITARIO',
            tooltip: 'Nessun partner indicato'
        };
    };

    const config = getStatusConfig();

    return (
        <div
            title={config.tooltip}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: `${config.color}15`,
                border: `1.5px solid ${config.color}`,
                fontSize: '0.7rem',
                fontWeight: 800,
                color: config.color,
                cursor: 'help',
                transition: '0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${config.color}40`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <span style={{ fontSize: '0.9rem' }}>{config.icon}</span>
            <span>{config.label}</span>
        </div>
    );
}

export function TeamPairingIndicator({ registration }) {
    const { team_status, team_id, secondo_cellulare } = registration;

    // Determine visual state
    const hasPartnerIndicated = secondo_cellulare && secondo_cellulare.trim() !== '';

    let displayStatus = team_status || 'SINGLE';

    // Override if no partner indicated
    if (!hasPartnerIndicated) {
        displayStatus = 'SINGLE';
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TeamStatusBadge status={displayStatus} teamId={team_id} />
            {team_id && (
                <span
                    style={{
                        fontSize: '0.65rem',
                        color: '#666',
                        fontFamily: 'monospace',
                        opacity: 0.7
                    }}
                    title="Team ID"
                >
                    #{team_id.substring(0, 8)}
                </span>
            )}
        </div>
    );
}
