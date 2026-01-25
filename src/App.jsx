import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
    const [registrations, setRegistrations] = useState([])
    const [messages, setMessages] = useState([])
    const [activeTab, setActiveTab] = useState('registrations')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isDevMode, setIsDevMode] = useState(false)

    // CRM State
    const [selectedItem, setSelectedItem] = useState(null) // State for full-screen detail view
    const [notes, setNotes] = useState([])
    const [newNote, setNewNote] = useState('')
    const [isNoteLoading, setIsNoteLoading] = useState(false)

    useEffect(() => {
        fetchAllData()
    }, [])

    useEffect(() => {
        if (selectedItem && activeTab === 'messages') {
            fetchNotes(selectedItem.id)
        }
    }, [selectedItem])

    async function fetchAllData() {
        setLoading(true)
        setError(null)
        try {
            const { data: regData, error: regError } = await supabase.from('registrations').select('*').order('created_at', { ascending: false })
            if (regError) throw regError
            setRegistrations(regData)

            const { data: msgData, error: msgError } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
            if (msgError) throw msgError
            setMessages(msgData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function fetchNotes(messageId) {
        const { data, error } = await supabase
            .from('message_notes')
            .select('*')
            .eq('message_id', messageId)
            .order('created_at', { ascending: true })

        if (!error) setNotes(data)
    }

    async function addNote() {
        if (!newNote.trim()) return
        setIsNoteLoading(true)
        const noteData = {
            message_id: selectedItem.id,
            content: newNote,
            admin_name: 'Admin Renga'
        }

        const { error } = await supabase.from('message_notes').insert([noteData])
        if (!error) {
            setNewNote('')
            fetchNotes(selectedItem.id)
        }
        setIsNoteLoading(false)
    }

    const handleInspect = (e, item) => {
        if (!isDevMode) return;
        if (e.ctrlKey || e.metaKey || e.type === 'contextmenu') {
            e.preventDefault()
            const payload = JSON.stringify(item, null, 2);
            navigator.clipboard.writeText(payload);
            alert('🧬 DNA Copied!');
        }
    }

    // MAIN RENDER
    return (
        <div style={{ padding: '20px', fontFamily: '"Inter", sans-serif', backgroundColor: '#161616', minHeight: '100vh', color: '#f4f4f4' }}>
            {/* Header: Fixed on top */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #393939', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontWeight: 300, letterSpacing: '2px', margin: 0, fontSize: '1.5rem' }}>
                        RENGA <span style={{ color: '#FFCC00', fontWeight: 800 }}>TREFFEN</span> 2026
                    </h1>
                </div>
                {!selectedItem && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={fetchAllData} style={btnSecondaryStyle}>{loading ? '...' : '🔄 Refresh'}</button>
                        <div onClick={() => setIsDevMode(!isDevMode)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <div style={{ width: '30px', height: '16px', backgroundColor: isDevMode ? '#FFCC00' : '#393939', borderRadius: '10px', position: 'relative' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: isDevMode ? '#000' : '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: isDevMode ? '16px' : '2px', transition: '0.2s' }} />
                            </div>
                            <span style={{ fontSize: '0.6rem' }}>DEV</span>
                        </div>
                    </div>
                )}
                {selectedItem && (
                    <button
                        onClick={() => setSelectedItem(null)}
                        style={{ ...btnSecondaryStyle, backgroundColor: '#393939', borderColor: '#FFCC00', fontWeight: 'bold' }}
                    >
                        ← TORNA ALLA LISTA
                    </button>
                )}
            </header>

            {error && (
                <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {!selectedItem ? (
                <>
                    {/* Tabs Navigation */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button onClick={() => { setActiveTab('registrations'); }} style={tabStyle(activeTab === 'registrations', '#FFCC00')}>ISCRIZIONI ({registrations.length})</button>
                        <button onClick={() => { setActiveTab('messages'); }} style={tabStyle(activeTab === 'messages', '#E6007E')}>MESSAGGI ({messages.length})</button>
                    </div>

                    {/* Table View */}
                    <div style={{ backgroundColor: '#262626', borderRadius: '8px', border: '1px solid #393939', overflow: 'hidden' }}>
                        {activeTab === 'registrations' ? renderTable(registrations, ['TEAM', 'PILOTA', 'MOTO', 'DATA'], (reg) => (
                            <>
                                <td style={tdStyle}><span style={{ color: '#FFCC00', fontWeight: 'bold' }}>{reg.team_name}</span></td>
                                <td style={tdStyle}>{reg.nome} {reg.cognome}</td>
                                <td style={tdStyle}>{reg.moto}</td>
                                <td style={tdStyle}>{new Date(reg.created_at).toLocaleDateString()}</td>
                            </>
                        )) : renderTable(messages, ['MITTENTE', 'MESSAGGIO', 'DATA'], (msg) => (
                            <>
                                <td style={tdStyle}><strong>{msg.name}</strong><br /><small style={{ color: '#8d8d8d' }}>{msg.email}</small></td>
                                <td style={tdStyle}><div style={{ maxWidth: '600px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div></td>
                                <td style={tdStyle}>{new Date(msg.created_at).toLocaleDateString()}</td>
                            </>
                        ))}
                    </div>
                </>
            ) : (
                /* FULL SCREEN DETAIL VIEW (CRM) */
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '30px', animation: 'fadeIn 0.3s ease-in' }}>

                    {/* Header Card */}
                    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #393939', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '5px', color: '#FFCC00' }}>{selectedItem.name}</h2>
                                <p style={{ color: '#8d8d8d', margin: 0 }}>{selectedItem.email} • Ricevuto il {new Date(selectedItem.created_at).toLocaleString()}</p>
                            </div>
                            <span style={{ backgroundColor: '#FFCC00', color: '#000', padding: '5px 15px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>TICKET APERTO</span>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #FFCC00', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            {selectedItem.message}
                        </div>
                    </div>

                    {/* Timeline / Notes Card */}
                    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #393939', padding: '30px' }}>
                        <h3 style={{ fontSize: '1rem', color: '#8d8d8d', letterSpacing: '2px', marginBottom: '25px', textTransform: 'uppercase' }}>Cronologia Note CRM ({notes.length})</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                            {notes.length === 0 && <p style={{ color: '#555', textAlign: 'center', padding: '20px' }}>Nessun appunto registrato per questo messaggio.</p>}
                            {notes.map(note => (
                                <div key={note.id} style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
                                    <div style={{ width: '40px', height: '40px', backgroundColor: '#393939', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>A</div>
                                    <div style={{ flex: 1, backgroundColor: '#262626', padding: '15px', borderRadius: '0 12px 12px 12px', border: '1px solid #333' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{note.admin_name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#8d8d8d' }}>{new Date(note.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{note.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* New Note Input */}
                        <div style={{ borderTop: '1px solid #333', paddingTop: '25px' }}>
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Scrivi una nota interna o un appunto sull'interazione..."
                                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #393939', color: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '15px', resize: 'none', outline: 'none', transition: '0.2s' }}
                                rows="4"
                                onFocus={(e) => e.target.style.borderColor = '#FFCC00'}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={addNote}
                                    disabled={isNoteLoading}
                                    style={{ backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', fontWeight: '800', transition: '0.2s', transform: isNoteLoading ? 'scale(0.98)' : 'scale(1)' }}
                                >
                                    {isNoteLoading ? 'SALVATAGGIO...' : '+ REGISTRA APPUNTO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    )

    function renderTable(data, headers, rowFunc) {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#161616', color: '#8d8d8d', textAlign: 'left', fontSize: '0.75rem' }}>
                        {headers.map(h => <th key={h} style={{ padding: '18px' }}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr
                            key={item.id}
                            onClick={(e) => { setSelectedItem(item); handleInspect(e, item); }}
                            style={{ borderBottom: '1px solid #393939', transition: '0.2s', cursor: 'pointer' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {rowFunc(item)}
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }
}

// Styles
const btnSecondaryStyle = { background: 'transparent', border: '1px solid #393939', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '50px' };
const tabStyle = (active, color) => ({ padding: '15px 25px', backgroundColor: active ? '#262626' : 'transparent', border: 'none', borderBottom: active ? `4px solid ${color}` : '4px solid transparent', color: active ? '#fff' : '#8d8d8d', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem' });
const tdStyle = { padding: '18px', fontSize: '0.9rem' };

export default App
