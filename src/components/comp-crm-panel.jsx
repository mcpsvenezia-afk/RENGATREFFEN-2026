/**
 * 🧬 COMPONENT: CRM Detail Panel
 * Goal: Detailed view of an item (Registration or Message) with Notes
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isNoteLoading, setIsNoteLoading] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editNoteContent, setEditNoteContent] = useState('');

    const noteTable = type === 'registration' ? 'registration_notes' : 'message_notes';
    const foreignKey = type === 'registration' ? 'registration_id' : 'message_id';

    useEffect(() => {
        if (item) fetchNotes();
    }, [item]);

    async function fetchNotes() {
        const { data, error } = await supabase
            .from(noteTable)
            .select('*')
            .eq(foreignKey, item.id)
            .order('created_at', { ascending: true });
        if (!error) setNotes(data);
    }

    async function addNote() {
        if (!newNote.trim()) return;
        setIsNoteLoading(true);
        const { error } = await supabase.from(noteTable).insert([
            { [foreignKey]: item.id, content: newNote, admin_name: 'Admin Renga' }
        ]);
        if (!error) {
            setNewNote('');
            fetchNotes();
        }
        setIsNoteLoading(false);
    }

    async function updateNote(noteId) {
        const { error } = await supabase.from(noteTable).update({ content: editNoteContent }).eq('id', noteId);
        if (!error) {
            setEditingNoteId(null);
            fetchNotes();
        }
    }

    async function deleteNote(noteId) {
        if (!confirm('Eliminare definitivamente questa nota?')) return;
        const { error } = await supabase.from(noteTable).delete().eq('id', noteId);
        if (!error) fetchNotes();
    }

    const inputStyle = { width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '10px', resize: 'none', outline: 'none' };
    const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px' };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '30px', animation: 'fadeIn 0.2s ease-out' }}>
            {/* ITEM DETAILS */}
            <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #393939', padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '5px', color: '#FFCC00' }}>
                            {type === 'registration' ? item.team_name : item.name}
                        </h2>
                        <p style={{ color: '#8d8d8d', margin: 0 }}>
                            {type === 'registration' ? `${item.nome} ${item.cognome}` : item.email} • {new Date(item.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {Object.entries(item).map(([key, value]) => {
                        if (['id', 'created_at', 'team_name', 'name'].includes(key)) return null;
                        if (!value) return null;
                        return (
                            <div key={key} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                                <small style={{ color: '#666', textTransform: 'uppercase', fontSize: '0.6rem' }}>{key.replace(/_/g, ' ')}</small>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>{String(value)}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* CRM NOTES */}
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
                                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#ccc' }}>{note.content}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ borderTop: '1px solid #333', paddingTop: '25px' }}>
                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Aggiungi una nota..." style={inputStyle} rows="3" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={addNote} disabled={isNoteLoading} style={{ backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', fontWeight: '800' }}>
                            {isNoteLoading ? '...' : '+ AGGIUNGI NOTA'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
