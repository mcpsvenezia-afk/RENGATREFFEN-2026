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
    const [selectedItem, setSelectedItem] = useState(null) // Holds the active message/reg for detail view
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

    return (
        <div style={{ padding: '20px', fontFamily: '"Inter", sans-serif', backgroundColor: '#161616', minHeight: '100vh', color: '#f4f4f4', position: 'relative' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #393939', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontWeight: 300, letterSpacing: '2px', margin: 0, fontSize: '1.5rem' }}>
                        RENGA <span style={{ color: '#FFCC00', fontWeight: 800 }}>TREFFEN</span> 2026
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={fetchAllData} style={btnSecondaryStyle}>{loading ? '...' : '🔄 Refresh'}</button>
                    <div onClick={() => setIsDevMode(!isDevMode)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <div style={{ width: '30px', height: '16px', backgroundColor: isDevMode ? '#FFCC00' : '#393939', borderRadius: '10px', position: 'relative' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: isDevMode ? '#000' : '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: isDevMode ? '16px' : '2px', transition: '0.2s' }} />
                        </div>
                        <span style={{ fontSize: '0.6rem' }}>DEV</span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => { setActiveTab('registrations'); setSelectedItem(null); }} style={tabStyle(activeTab === 'registrations', '#FFCC00')}>ISCRIZIONI ({registrations.length})</button>
                <button onClick={() => { setActiveTab('messages'); setSelectedItem(null); }} style={tabStyle(activeTab === 'messages', '#E6007E')}>MESSAGGI ({messages.length})</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 400px' : '1fr', gap: '20px', transition: '0.3s' }}>
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
                            <td style={tdStyle}><div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div></td>
                            <td style={tdStyle}>{new Date(msg.created_at).toLocaleDateString()}</td>
                        </>
                    ))}
                </div>

                {selectedItem && activeTab === 'messages' && (
                    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #393939', padding: '20px', position: 'sticky', top: '20px', height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Dettaglio Messaggio</h2>
                            <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: '#8d8d8d', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#262626', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#FFCC00', marginBottom: '5px' }}>DA: {selectedItem.name}</div>
                            <div style={{ fontSize: '0.9rem' }}>{selectedItem.message}</div>
                            <div style={{ marginTop: '15px' }}>
                                <a href={`mailto:${selectedItem.email}?subject=Renga Treffen 2026 - Risposta`} style={{ color: '#000', backgroundColor: '#FFCC00', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    ✉ RISPONDI VIA EMAIL
                                </a>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #393939', paddingTop: '20px' }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', color: '#8d8d8d' }}>NOTE & LOGS ({notes.length})</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                                {notes.map(note => (
                                    <div key={note.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '4px', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8d8d8d', marginBottom: '5px' }}>
                                            <span>{note.admin_name}</span>
                                            <span>{new Date(note.created_at).toLocaleString()}</span>
                                        </div>
                                        {note.content}
                                    </div>
                                ))}
                            </div>
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Aggiungi una nota CRM..."
                                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #393939', color: '#fff', padding: '10px', borderRadius: '4px', marginBottom: '10px', resize: 'none' }}
                                rows="3"
                            />
                            <button onClick={addNote} disabled={isNoteLoading} style={{ width: '100%', backgroundColor: '#393939', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {isNoteLoading ? 'Salvataggio...' : '+ AGGIUNGI NOTA'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    function renderTable(data, headers, rowFunc) {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#161616', color: '#8d8d8d', textAlign: 'left', fontSize: '0.75rem' }}>
                        {headers.map(h => <th key={h} style={{ padding: '15px' }}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id} onClick={(e) => { setSelectedItem(item); handleInspect(e, item); }} style={{ borderBottom: '1px solid #393939', transition: '0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            {rowFunc(item)}
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }
}

// Styles
const btnSecondaryStyle = { background: 'transparent', border: '1px solid #393939', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '4px' };
const tabStyle = (active, color) => ({ padding: '12px 20px', backgroundColor: active ? '#262626' : 'transparent', border: 'none', borderBottom: active ? `3px solid ${color}` : '3px solid transparent', color: active ? '#fff' : '#8d8d8d', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' });
const tdStyle = { padding: '15px', fontSize: '0.85rem' };

export default App
