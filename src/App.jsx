import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
    const [registrations, setRegistrations] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchRegistrations()
    }, [])

    async function fetchRegistrations() {
        console.log('--- Fetching Registrations ---')
        const { data, error } = await supabase
            .from('registrations')
            .select('*')

        if (error) {
            console.error('Error fetching registrations:', error)
            setError(error.message)
        } else {
            console.log('Registrations fetched:', data)
            setRegistrations(data)
        }
    }

    // Dev Mode State Switch
    const [isDevMode, setIsDevMode] = useState(false);

    // UNIVERSAL_DEV_MODE_v1: Ctrl + Click to inspect & Copy JSON
    const handleInspect = (e, item) => {
        if (!isDevMode) return;

        if (e.ctrlKey || e.metaKey || e.type === 'contextmenu') {
            e.preventDefault()
            e.stopPropagation()

            console.group('🧬 DNA INSPECTOR (DATA)')
            console.log('Item DNA:', {
                id: item.id || 'unknown-id',
                version: 'v1.0.0',
                context: 'App.jsx Dashboard'
            })
            console.log('Raw Payload:', item)
            console.groupEnd()

            // COPY JSON TO CLIPBOARD
            const payload = JSON.stringify(item, null, 2);
            navigator.clipboard.writeText(payload).then(() => {
                alert(`🧬 JSON DATI COPIATO!\n\nPuoi incollarlo direttamente nella chat.\n\nID: ${item.id}`);
            }).catch(err => {
                console.error('Clipboard Error:', err);
                alert('Errore copia clipboard. Vedi console.');
            });
        }
    }

    return (
        <div style={{
            padding: '20px',
            fontFamily: '"Inter", sans-serif',
            backgroundColor: '#161616', // Carbon Dark Background
            minHeight: '100vh',
            color: '#f4f4f4'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #393939',
                paddingBottom: '1rem',
                marginBottom: '2rem'
            }}>
                <h1 style={{ fontWeight: 300, letterSpacing: '1px' }}>Blitz Registration Dashboard</h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Test Data Generator (Only in Dev Mode) */}
                    {isDevMode && (
                        <button
                            onClick={generateTestData}
                            style={{
                                padding: '8px 16px',
                                fontSize: '0.8rem',
                                backgroundColor: '#FFCC00',
                                color: '#161616',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}
                        >
                            + Dati Test
                        </button>
                    )}

                    {/* Dev Mode Toggle Switch */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label htmlFor="dev-mode-switch" style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#8d8d8d', textTransform: 'uppercase' }}>
                            Dev Mode
                        </label>
                        <div
                            onClick={() => setIsDevMode(!isDevMode)}
                            style={{
                                width: '40px',
                                height: '20px',
                                backgroundColor: isDevMode ? '#10b981' : '#393939',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: isDevMode ? '22px' : '2px',
                                transition: 'left 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ color: '#ff839b', marginBottom: '20px', border: '1px solid #ff839b', padding: '10px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={fetchRegistrations}
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #FFCC00',
                        color: '#FFCC00',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 204, 0, 0.1)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    Aggiorna Dati
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#262626', color: '#f4f4f4', textAlign: 'left' }}>
                            <th style={{ padding: '12px', borderBottom: '1px solid #393939' }}>Nome</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #393939' }}>Cognome</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #393939' }}>Email</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #393939' }}>Partner</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #393939' }}>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.map((reg, index) => (
                            <tr
                                key={reg.id}
                                onClick={(e) => handleInspect(e, reg)}
                                onContextMenu={(e) => handleInspect(e, reg)}
                                style={{
                                    cursor: isDevMode ? 'help' : 'default',
                                    // DARK THEME HIGH CONTRAST (Zebra Striping)
                                    backgroundColor: isDevMode ? '#003366' : (index % 2 === 0 ? '#1a1a1a' : '#2a2a2a'),
                                    color: '#ffffff',
                                    borderBottom: '1px solid #333333'
                                }}
                                title={isDevMode ? "Premi Ctrl + Clic (o Tasto Destro) per DNA" : ""}
                            >
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#fff' }}>{reg.nome}</td>
                                <td style={{ padding: '12px' }}>{reg.cognome}</td>
                                <td style={{ padding: '12px', color: '#0044cc' }}>{reg.email}</td>
                                <td style={{ padding: '12px' }}>{reg.partner_name}</td>
                                <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>{new Date(reg.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        {registrations.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#f4f4f4', backgroundColor: '#161616' }}>
                                    {isDevMode ? "Nessun dato. Usa '+ Dati Test' per generare un record." : "Nessun dato trovato."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    async function generateTestData() {
        const fakeData = {
            nome: 'TestUser',
            cognome: 'DevMode',
            email: `test.${Date.now()}@blitz.dev`,
            telefono: '+00 123456789',
            partner_name: 'AI Companion',
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('registrations').insert([fakeData]);
        if (error) alert('Error creating test data: ' + error.message);
        else fetchRegistrations();
    }
}

export default App
