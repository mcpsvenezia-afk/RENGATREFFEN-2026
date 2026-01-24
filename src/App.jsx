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

    // UNIVERSAL_DEV_MODE_v1: Ctrl + Click to inspect
    const handleInspect = (e, item) => {
        if (!isDevMode) return; // Silent exit if Dev Mode is OFF

        if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            e.stopPropagation()
            console.log('--- DNA INSPECTOR ---')
            console.log('Item DNA:', {
                id: item.id || 'unknown-id',
                base_plugin_id: 'blitz-registration-manager',
                version: 'v1.0.0',
                context: 'App.jsx Dashboard'
            })
            console.log('Raw Payload:', item)
            alert(`🧬 DNA INSPECTOR ACTIVE\nID: ${item.id}\nCheck Console for full payload.`)
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #eee',
                paddingBottom: '1rem',
                marginBottom: '2rem'
            }}>
                <h1>Blitz Registration Dashboard</h1>

                {/* Dev Mode Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="dev-mode-switch" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        🧬 DEV MODE
                    </label>
                    <div
                        onClick={() => setIsDevMode(!isDevMode)}
                        style={{
                            width: '50px',
                            height: '24px',
                            backgroundColor: isDevMode ? '#10b981' : '#ccc',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.3s'
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: isDevMode ? '28px' : '2px',
                            transition: 'left 0.3s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ color: 'red', marginBottom: '20px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <button onClick={fetchRegistrations}>Aggiorna Dati</button>
            </div>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th>Nome</th>
                        <th>Cognome</th>
                        <th>Email</th>
                        <th>Partner</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    {registrations.map((reg) => (
                        <tr
                            key={reg.id}
                            onClick={(e) => handleInspect(e, reg)}
                            style={{ cursor: 'pointer' }}
                            title="Ctrl + Clic per ispezionare"
                        >
                            <td>{reg.nome}</td>
                            <td>{reg.cognome}</td>
                            <td>{reg.email}</td>
                            <td>{reg.partner_name}</td>
                            <td>{new Date(reg.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                    {registrations.length === 0 && !error && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                Nessun dato trovato.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default App
