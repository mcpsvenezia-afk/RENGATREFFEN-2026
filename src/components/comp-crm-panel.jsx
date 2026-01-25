/**
 * 🧬 COMPONENT: CRM Detail Panel v3.4
 * Goal: MANUAL SAVE COMMIT, ROBUST PHOTO PERSISTENCE
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editNoteContent, setEditNoteContent] = useState('');

    const noteTable = type === 'registration' ? 'registration_notes' : 'message_notes';
    const foreignKey = type === 'registration' ? 'registration_id' : 'message_id';

    useEffect(() => {
        if (item) {
            setLocalItem(item);
            fetchNotes();
        }
    }, [item]);

    async function fetchNotes() {
        const { data, error } = await supabase.from(noteTable).select('*').eq(foreignKey, item.id).order('created_at', { ascending: false });
        if (!error) setNotes(data);
    }

    // --- SALVATAGGIO GLOBALE ---
    async function commitAllChanges() {
        setIsSaving(true);
        const table = type === 'registration' ? 'registrations' : 'messages';
        const { error } = await supabase.from(table).update(localItem).eq('id', item.id);

        if (!error) {
            alert('✅ DATI SALVATI DEFINITIVAMENTE NEL DATABASE');
            onRefresh();
        } else {
            alert('❌ ERRORE SALVATAGGIO: ' + error.message);
        }
        setIsSaving(false);
    }

    async function addNote() {
        if (!newNote.trim()) return;
        const { error } = await supabase.from(noteTable).insert([{ [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }]);
        if (!error) { setNewNote(''); fetchNotes(); }
        else alert('Errore: ' + error.message);
    }

    async function updateNote(noteId) {
        const { error } = await supabase.from(noteTable).update({ content: editNoteContent }).eq('id', noteId);
        if (!error) { setEditingNoteId(null); fetchNotes(); }
    }

    async function deleteNote(noteId) {
        if (confirm('Eliminare nota?')) {
            await supabase.from(noteTable).delete().eq('id', noteId);
            fetchNotes();
        }
    }

    async function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        setIsPhotoLoading(true);
        try {
            const fn = `${item.id}-${Date.now()}.${file.name.split('.').pop()}`;
            const { error: upErr } = await supabase.storage.from('registrations').upload(`photos/${fn}`, file);
            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage.from('registrations').getPublicUrl(`photos/${fn}`);

            // Aggiorna subito il DB per sicurezza
            const { error: dbErr } = await supabase.from('registrations').update({ pilot_photo: publicUrl }).eq('id', item.id);
            if (dbErr) throw dbErr;

            setLocalItem({ ...localItem, pilot_photo: publicUrl });
            alert('📸 Foto salvata con successo!');
            onRefresh();
        } catch (err) {
            alert('Errore caricamento foto: ' + err.message);
        } finally {
            setIsPhotoLoading(false);
        }
    }

    const translateLabel = (key) => {
        const map = { team_name: 'NOME TEAM', team_role: 'RUOLO', moto_details: 'MOTO', nome: 'NOME', cognome: 'COGNOME', email: 'EMAIL', telefono: 'TELEFONO', pilot_bio: 'BIOGRAFIA' };
        return map[key] || key.replace(/_/g, ' ').toUpperCase();
    };

    const regTabs = [
        { id: 'general', label: 'TEAM & MOTO', fields: ['team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation'] },
        { id: 'personal', label: 'ANAGRAFICA', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale', 'citta_nascita', 'citta_residenza', 'via_residenza', 'civico_residenza', 'cap_residenza'] },
        { id: 'requirements', label: 'REQUISITI', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine'] },
        { id: 'health', label: 'SALUTE', fields: ['food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] },
        { id: 'bio', label: 'BIO PILOTA', fields: ['pilot_photo', 'pilot_bio'] }
    ];

    const getPhotoUrl = (url) => {
        if (!url || typeof url !== 'string' || url === '{}' || !url.startsWith('http')) return null;
        return `${url}?t=${Date.now()}`;
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 450px', gap: '40px' }}>

            <div style={{ backgroundColor: '#111', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden' }}>
                {/* Header Dettaglio con COMMIT BUTTON */}
                <div style={{ padding: '40px', backgroundColor: '#000', borderBottom: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', color: '#FFCC00', margin: 0, fontWeight: 900 }}>{localItem.team_name || localItem.name}</h2>
                        <p style={{ color: '#E6007E', margin: '5px 0 0 0', fontWeight: 'bold' }}>ID: {item.id}</p>
                    </div>
                    <button onClick={commitAllChanges} disabled={isSaving} style={btnCommit}>
                        {isSaving ? 'SALVATAGGIO...' : '💾 SALVA MODIFICHE'}
                    </button>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#0d0d12' }}>
                    {(type === 'registration' ? regTabs : [{ id: 'm', label: 'MESSAGGIO' }]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '50px' }}>
                    {activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
                            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                                <div style={photoBigBox}>
                                    {isPhotoLoading ? (
                                        <div className="spinner">⌛</div>
                                    ) : getPhotoUrl(localItem.pilot_photo) ? (
                                        <img src={getPhotoUrl(localItem.pilot_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span>📷</span>
                                    )}
                                    <input type="file" onChange={handlePhotoUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                </div>
                                <div style={{ color: '#888', fontSize: '1.1rem' }}>
                                    <strong style={{ color: '#FFCC00' }}>FOTO PROFILO</strong><br />Clicca sul riquadro.<br />Il salvataggio è immediato.
                                </div>
                            </div>
                            <div>
                                <label style={megaLabel}>BIOGRAFIA PILOTA</label>
                                <textarea
                                    value={localItem.pilot_bio || ''}
                                    onChange={e => setLocalItem({ ...localItem, pilot_bio: e.target.value })}
                                    style={ultraArea}
                                    placeholder="Scrivi qui la biografia del pilota..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {(type === 'registration' ? regTabs.find(t => t.id === activeTab).fields : ['message']).map(f => (
                                <div key={f} style={fBox}>
                                    <label style={megaLabel}>{translateLabel(f)}</label>
                                    <input
                                        value={localItem[f] || ''}
                                        onChange={e => setLocalItem({ ...localItem, [f]: e.target.value })}
                                        style={fInput}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR CRM */}
            <div style={{ backgroundColor: '#000', borderRadius: '40px', padding: '40px', border: '2px solid #E6007E' }}>
                <h3 style={{ color: '#E6007E', fontWeight: 900, fontSize: '1.4rem', marginBottom: '30px' }}>LOG ATTIVITÀ CRM</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                    <button onClick={addNote} style={btnYellowFull}>+ AGGIUNGI NOTA</button>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} style={darkInputFull} placeholder="Nuova nota..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '600px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={noteBox}>
                            <div style={noteHeader}>
                                <span>{new Date(n.created_at).toLocaleString()}</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <span onClick={() => { setEditingNoteId(n.id); setEditNoteContent(n.content); }} style={{ cursor: 'pointer' }}>✏️</span>
                                    <span onClick={() => deleteNote(n.id)} style={{ cursor: 'pointer' }}>🗑️</span>
                                </div>
                            </div>
                            {editingNoteId === n.id ? (
                                <div>
                                    <textarea value={editNoteContent} onChange={e => setEditNoteContent(e.target.value)} style={darkInputFull} />
                                    <button onClick={() => updateNote(n.id)} style={btnSaveMini}>SALVA</button>
                                </div>
                            ) : (
                                <div style={{ color: '#fff', fontSize: '1.1rem' }}>{n.content}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
                .spinner { animation: rotate 1s linear infinite; font-size: 3rem; }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

const tabStyle = (active) => ({ flex: 1, padding: '25px', border: 'none', background: active ? '#1a1a1f' : 'transparent', color: active ? '#FFCC00' : '#555', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', borderBottom: active ? '4px solid #FFCC00' : 'none' });
const megaLabel = { color: '#FFCC00', fontSize: '0.8rem', fontWeight: 900, display: 'block', marginBottom: '8px' };
const fBox = { backgroundColor: '#1a1a1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' };
const fInput = { width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' };
const ultraArea = { width: '100%', backgroundColor: '#1a1a1f', border: '2px solid #333', color: '#fff', fontSize: '1.4rem', padding: '25px', borderRadius: '24px', minHeight: '400px', outline: 'none' };
const btnCommit = { backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(255,204,0,0.3)' };
const btnYellowFull = { width: '100%', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' };
const darkInputFull = { width: '100%', backgroundColor: '#1a1a1f', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '16px', fontSize: '1.1rem', outline: 'none' };
const noteBox = { backgroundColor: '#1a1a1f', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #FFCC00' };
const noteHeader = { fontSize: '0.8rem', color: '#FFCC00', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' };
const photoBigBox = { width: '250px', height: '250px', backgroundColor: '#000', border: '4px dashed #FFCC00', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' };
const btnSaveMini = { backgroundColor: '#FFCC00', border: 'none', padding: '5px 15px', borderRadius: '5px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' };
