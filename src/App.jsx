import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
    const [registrations, setRegistrations] = useState([])
    const [messages, setMessages] = useState([])
    const [activeTab, setActiveTab] = useState('registrations') // 'registrations' or 'messages'
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isDevMode, setIsDevMode] = useState(false)

    useEffect(() => {
        fetchAllData()
    }, [])

    async function fetchAllData() {
        setLoading(true)
        setError(null)
        console.log('--- 🧪 FETCHING ALL ADMIN DATA ---')

        try {
            // Fetch Registrations
            const { data: regData, error: regError } = await supabase
                .from('registrations')
                .select('*')
                .order('created_at', { ascending: false })

            if (regError) throw regError
            setRegistrations(regData)

            // Fetch Messages
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })

            if (msgError) throw msgError
            setMessages(msgData)

        } catch (err) {
            console.error('Fetch Error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // UNIVERSAL_DEV_MODE_v1: Ctrl + Click to inspect & Copy JSON
    const handleInspect = (e, item) => {
        if (!isDevMode) return;
        if (e.ctrlKey || e.metaKey || e.type === 'contextmenu') {
            e.preventDefault()
            e.stopPropagation()

            const payload = JSON.stringify(item, null, 2);
            navigator.clipboard.writeText(payload).then(() => {
                alert(`🧬 DNA DETECTED!\n\nPayload copiato negli appunti.\nID: ${item.id || 'N/A'}`);
            });
            console.log('🧬 DNA PAYLOAD:', item);
        }
    }

    return (
        <div style={{
            padding: '20px',
            fontFamily: '"Inter", sans-serif',
            backgroundColor: '#161616',
            minHeight: '100vh',
            color: '#f4f4f4'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #393939',
                paddingBottom: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{ fontWeight: 300, letterSpacing: '2px', margin: 0, fontSize: '1.5rem' }}>
                        RENGA <span style={{ color: '#FFCC00', fontWeight: 800 }}>TREFFEN</span> 2026
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: '#8d8d8d', marginTop: '5px' }}>ADMIN CONSOLE v1.2.0</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={fetchAllData}
                        style={{
                            background: 'transparent',
                            border: '1px solid #393939',
                            color: '#fff',
                            padding: '8px 15px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            borderRadius: '4px'
                        }}
                    >
                        {loading ? 'Aggiornamento...' : '🔄 Refresh Data'}
                    </button>

                    {/* Dev Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#8d8d8d' }}>DEV MODE</span>
                        <div
                            onClick={() => setIsDevMode(!isDevMode)}
                            style={{
                                width: '34px', height: '18px', backgroundColor: isDevMode ? '#FFCC00' : '#393939',
                                borderRadius: '10px', cursor: 'pointer', position: 'relative'
                            }}
                        >
                            <div style={{
                                width: '14px', height: '14px', backgroundColor: isDevMode ? '#000' : '#fff',
                                borderRadius: '50%', position: 'absolute', top: '2px', left: isDevMode ? '18px' : '2px',
                                transition: '0.2s'
                            }} />
                        </div>
                    </div>
                </div>
            </header>

            {error && (
                <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('registrations')}
                    style={{
                        padding: '12px 25px',
                        backgroundColor: activeTab === 'registrations' ? '#393939' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'registrations' ? '3px solid #FFCC00' : '3px solid transparent',
                        color: activeTab === 'registrations' ? '#fff' : '#8d8d8d',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        transition: '0.3s'
                    }}
                >
                    ISCRIZIONI ({registrations.length})
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    style={{
                        padding: '12px 25px',
                        backgroundColor: activeTab === 'messages' ? '#393939' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'messages' ? '3px solid #E6007E' : '3px solid transparent',
                        color: activeTab === 'messages' ? '#fff' : '#8d8d8d',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        transition: '0.3s'
                    }}
                >
                    MESSAGGI ({messages.length})
                </button>
            </div>

            {/* Main Content View */}
            <div style={{ backgroundColor: '#262626', borderRadius: '4px', overflow: 'hidden', border: '1px solid #393939' }}>
                {activeTab === 'registrations' ? renderRegistrations() : renderMessages()}
            </div>
        </div>
    )

    function renderRegistrations() {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#161616', color: '#8d8d8d', textAlign: 'left', fontSize: '0.8rem' }}>
                        <th style={{ padding: '15px' }}>TEAM / PILOTA</th>
                        <th style={{ padding: '15px' }}>INFO CONTATTO</th>
                        <th style={{ padding: '15px' }}>MOTO</th>
                        <th style={{ padding: '15px' }}>DATA</th>
                    </tr>
                </thead>
                <tbody>
                    {registrations.map(reg => (
                        <tr
                            key={reg.id}
                            onClick={(e) => handleInspect(e, reg)}
                            style={{ borderBottom: '1px solid #393939', transition: '0.2s', cursor: isDevMode ? 'help' : 'default' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <td style={{ padding: '15px' }}>
                                <div style={{ color: '#FFCC00', fontWeight: 'bold' }}>{reg.team_name}</div>
                                <div style={{ fontSize: '0.85rem' }}>{reg.nome} {reg.cognome || ''}</div>
                                {reg.partner_name && (
                                    <div style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>Partner: {reg.partner_name}</div>
                                )}
                            </td>
                            <td style={{ padding: '15px', fontSize: '0.85rem' }}>
                                <div>{reg.email}</div>
                                <div style={{ color: '#8d8d8d' }}>{reg.telefono}</div>
                            </td>
                            <td style={{ padding: '15px', fontSize: '0.85rem' }}>{reg.moto}</td>
                            <td style={{ padding: '15px', fontSize: '0.75rem', color: '#8d8d8d' }}>
                                {new Date(reg.created_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }

    function renderMessages() {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#161616', color: '#8d8d8d', textAlign: 'left', fontSize: '0.8rem' }}>
                        <th style={{ padding: '15px' }}>MITTENTE</th>
                        <th style={{ padding: '15px' }}>MESSAGGIO</th>
                        <th style={{ padding: '15px' }}>DATA</th>
                    </tr>
                </thead>
                <tbody>
                    {messages.map(msg => (
                        <tr
                            key={msg.id}
                            onClick={(e) => handleInspect(e, msg)}
                            style={{ borderBottom: '1px solid #393939', transition: '0.2s', cursor: isDevMode ? 'help' : 'default' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <td style={{ padding: '15px', width: '250px' }}>
                                <div style={{ fontWeight: 'bold' }}>{msg.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#8d8d8d' }}>{msg.email}</div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <div style={{
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    padding: '10px',
                                    borderRadius: '4px'
                                }}>
                                    {msg.message}
                                </div>
                            </td>
                            <td style={{ padding: '15px', fontSize: '0.75rem', color: '#8d8d8d', width: '150px' }}>
                                {new Date(msg.created_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }
}

export default App
