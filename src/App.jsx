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
    const [selectedItem, setSelectedItem] = useState(null)
    const [notes, setNotes] = useState([])
    const [newNote, setNewNote] = useState('')
    const [isNoteLoading, setIsNoteLoading] = useState(false)
    const [editingNoteId, setEditingNoteId] = useState(null)
    const [editNoteContent, setEditNoteContent] = useState('')

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

            const { data: msgData, error: msgError } = await supabase.from('messages').select('*').neq('status', 'Archiviato').order('created_at', { ascending: false })
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
        const { error } = await supabase.from('message_notes').insert([{ message_id: selectedItem.id, content: newNote, admin_name: 'Admin Renga' }])
        if (!error) {
            setNewNote('')
            fetchNotes(selectedItem.id)
        }
        setIsNoteLoading(false)
    }

    async function updateNote(noteId) {
        const { error } = await supabase.from('message_notes').update({ content: editNoteContent }).eq('id', noteId)
        if (!error) {
            setEditingNoteId(null)
            fetchNotes(selectedItem.id)
        }
    }

    async function deleteNote(noteId) {
        if (!confirm('Eliminare definitivamente questa nota?')) return
        const { error } = await supabase.from('message_notes').delete().eq('id', noteId)
        if (!error) fetchNotes(selectedItem.id)
    }

    async function archiveMessage(msgId) {
        if (!confirm('Archiviare questo messaggio? Verrà nascosto dalla lista principale.')) return
        const { error } = await supabase.from('messages').update({ status: 'Archiviato' }).eq('id', msgId)
        if (!error) {
            setSelectedItem(null)
            fetchAllData()
        }
    }

    async function deleteMessage(msgId) {
        if (!confirm('⚠️ ELIMINAZIONE DEFINITIVA: Sei sicuro? Questa azione cancellerà anche tutte le note associate.')) return
        const { error } = await supabase.from('messages').delete().eq('id', msgId)
        if (!error) {
            setSelectedItem(null)
            fetchAllData()
        }
    }

    const handleInspect = (e, item) => {
        if (!isDevMode) return;
        if (e.ctrlKey || e.metaKey || e.type === 'contextmenu') {
            e.preventDefault()
            navigator.clipboard.writeText(JSON.stringify(item, null, 2));
            alert('🧬 DNA Copied!');
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: '"Inter", sans-serif', backgroundColor: '#161616', minHeight: '100vh', color: '#f4f4f4' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #393939', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontWeight: 300, letterSpacing: '2px', margin: 0, fontSize: '1.5rem' }}>
                        RENGA <span style={{ color: '#FFCC00', fontWeight: 800 }}>TREFFEN</span> 2026
                    </h1>
                </div>
                {!selectedItem ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={fetchAllData} style={btnSecondaryStyle}>{loading ? '...' : '🔄 Refresh'}</button>
                        <div onClick={() => setIsDevMode(!isDevMode)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <div style={{ width: '30px', height: '16px', backgroundColor: isDevMode ? '#FFCC00' : '#393939', borderRadius: '10px', position: 'relative' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: isDevMode ? '#000' : '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: isDevMode ? '16px' : '2px', transition: '0.2s' }} />
                            </div>
                            <span style={{ fontSize: '0.6rem' }}>DEV</span>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setSelectedItem(null)} style={{ ...btnSecondaryStyle, backgroundColor: '#393939', borderColor: '#FFCC00', fontWeight: 'bold' }}>← TORNA ALLA LISTA</button>
                )}
            </header>

            {!selectedItem ? (
                <>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button onClick={() => setActiveTab('registrations')} style={tabStyle(activeTab === 'registrations', '#FFCC00')}>ISCRIZIONI ({registrations.length})</button>
                        <button onClick={() => setActiveTab('messages')} style={tabStyle(activeTab === 'messages', '#E6007E')}>MESSAGGI ({messages.length})</button>
                    </div>

                    <div style={{ backgroundColor: '#262626', borderRadius: '8px', border: '1px solid #393939', overflow: 'hidden' }}>
                        {activeTab === 'registrations' ? renderTable(registrations, ['TEAM', 'PILOTA', 'MOTO', 'DATA'], (reg) => (
                            <>
                                <td style={tdStyle}><span style={{ color: '#FFCC00', fontWeight: 'bold' }}>{reg.team_name}</span></td>
                                <td style={tdStyle}>{reg.nome} {reg.cognome}</td>
                                <td style={tdStyle}>{reg.moto}</td>
                                <td style={tdStyle}>{new Date(reg.created_at).toLocaleDateString()}</td>
                            </>
                        )) : renderTable(messages, ['MITTENTE', 'MESSAGGIO', 'STATO', 'DATA'], (msg) => (
                            <>
                                <td style={tdStyle}><strong>{msg.name}</strong><br /><small style={{ color: '#8d8d8d' }}>{msg.email}</small></td>
                                <td style={tdStyle}><div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div></td>
                                <td style={tdStyle}><span style={{ color: msg.status === 'Archiviato' ? '#888' : '#FFCC00', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{msg.status || 'Nuovo'}</span></td>
                                <td style={tdStyle}>{new Date(msg.created_at).toLocaleDateString()}</td>
                            </>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '30px', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #393939', padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '5px', color: '#FFCC00' }}>{selectedItem.name}</h2>
                                <p style={{ color: '#8d8d8d', margin: 0 }}>{selectedItem.email} • {new Date(selectedItem.created_at).toLocaleString()}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => archiveMessage(selectedItem.id)} style={{ backgroundColor: '#393939', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>📦 ARCHIVIA</button>
                                <button onClick={() => deleteMessage(selectedItem.id)} style={{ backgroundColor: '#4a1111', color: '#ff4444', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️ ELIMINA</button>
                            </div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #FFCC00', fontSize: '1.1rem', lineHeight: '1.6' }}>{selectedItem.message}</div>
                    </div>

                    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #393939', padding: '30px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#8d8d8d', letterSpacing: '2px', marginBottom: '25px', textTransform: 'uppercase' }}>Cronologia Note CRM ({notes.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                            {notes.map(note => (
                                <div key={note.id} style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
                                    <div style={{ flex: 1, backgroundColor: '#262626', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#FFCC00' }}>{note.admin_name} • {new Date(note.created_at).toLocaleString()}</span>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }} style={iconBtnStyle}>✏️</button>
                                                <button onClick={() => deleteNote(note.id)} style={iconBtnStyle}>❌</button>
                                            </div>
                                        </div>
                                        {editingNoteId === note.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <textarea value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} style={inputStyle} rows="3" />
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => updateNote(note.id)} style={{ backgroundColor: '#FFCC00', border: 'none', padding: '5px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Salva</button>
                                                    <button onClick={() => setEditingNoteId(null)} style={{ background: 'none', border: 'none', color: '#8d8d8d', cursor: 'pointer' }}>Annulla</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{note.content}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid #333', paddingTop: '25px' }}>
                            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Aggiungi una nota..." style={inputStyle} rows="3" />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={addNote} disabled={isNoteLoading} style={{ backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', fontWeight: '800' }}>{isNoteLoading ? '...' : '+ AGGIUNGI NOTA'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    )

    function renderTable(data, headers, rowFunc) {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#161616', color: '#8d8d8d', textAlign: 'left', fontSize: '0.75rem' }}>{headers.map(h => <th key={h} style={{ padding: '18px' }}>{h}</th>)}</tr>
                </thead>
                <tbody>{data.map(item => <tr key={item.id} onClick={(e) => { setSelectedItem(item); handleInspect(e, item); }} style={{ borderBottom: '1px solid #393939', transition: '0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>{rowFunc(item)}</tr>)}</tbody>
            </table>
        )
    }
}

const btnSecondaryStyle = { background: 'transparent', border: '1px solid #393939', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '50px' };
const tabStyle = (active, color) => ({ padding: '15px 25px', backgroundColor: active ? '#262626' : 'transparent', border: 'none', borderBottom: active ? `4px solid ${color}` : '4px solid transparent', color: active ? '#fff' : '#8d8d8d', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem' });
const tdStyle = { padding: '18px', fontSize: '0.9rem' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px' };
const inputStyle = { width: '100%', backgroundColor: '#111', border: '1px solid #393939', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '10px', resize: 'none', outline: 'none' };

export default App
