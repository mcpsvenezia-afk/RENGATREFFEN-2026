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

    // UNIVERSAL_DEV_MODE_v1: Ctrl + Click to inspect
    const handleInspect = (e, item) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            console.log('--- DNA INSPECTOR ---')
            console.log('Item DNA:', {
                id: item.id,
                base_plugin_id: 'blitz-registration-manager',
                version: 'v1.0.0'
            })
            console.log('Raw Payload:', item)
            alert(`DNA Inspector: Check console for full payload of ${item.nome}`)
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Blitz Registration Dashboard</h1>

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
