/**
 * 🧬 COMPONENT: CRM Detail Panel v3.5
 * Goal: FIXED BIO EDITING, PHOTO PERSISTENCE, DELETE ACTION
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

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
        if (!item?.id) return;
        const { data, error } = await supabase.from(noteTable).select('*').eq(foreignKey, item.id).order('created_at', { ascending: false });
        if (!error) setNotes(data);
    }

    // --- SALVATAGGIO GLOBALE ---
    async function commitAllChanges() {
        setIsSaving(true);
        try {
            const table = type === 'registration' ? 'registrations' : 'messages';

            // 🛡️ PULIZIA DATI
            const { id, created_at, ...updateData } = localItem;

            const { error } = await supabase.from(table).update(updateData).eq('id', item.id);

            if (error) throw error;

            alert('✅ DATI SALVATI CON SUCCESSO');
            onRefresh();
        } catch (err) {
            console.error('❌ SAVE ERROR:', err);
            alert('❌ ERRORE SALVATAGGIO: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    }

    // --- ELIMINAZIONE TOTALE ---
    async function handleDeleteItem() {
        const confirmDelete = confirm(`⚠️ ATTENZIONE: Sei sicuro di voler ELIMINARE DEFINITIVAMENTE questo ${type === 'registration' ? 'iscritto' : 'messaggio'}? Questa azione non è reversibile.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const table = type === 'registration' ? 'registrations' : 'messages';
            const { error } = await supabase.from(table).delete().eq('id', item.id);

            if (error) throw error;

            alert('🗑️ Eliminazione completata.');
            onRefresh();
            onBack();
        } catch (err) {
            alert('❌ Errore durante l\'eliminazione: ' + err.message);
        } finally {
            setIsDeleting(false);
        }
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
            console.log('🧬 PHOTO UPLOAD START:', file.name);
            const fileExt = file.name.split('.').pop();
            const fn = `${item.id}-${Date.now()}.${fileExt}`;
            const filePath = `photos/${fn}`;

            // 1. Storage Upload
            const { error: upErr } = await supabase.storage
                .from('registrations')
                .upload(filePath, file);

            if (upErr) {
                console.error('❌ STORAGE UPLOAD ERROR:', upErr);
                throw new Error('Upload fallito: ' + upErr.message);
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('registrations')
                .getPublicUrl(filePath);

            console.log('🧬 PHOTO PUBLIC URL:', publicUrl);

            // 3. Update DB Immediately to ensure persistence
            const { error: dbErr } = await supabase
                .from('registrations')
                .update({ pilot_photo: publicUrl })
                .eq('id', item.id);

            if (dbErr) {
                console.error('❌ DB PHOTO UPDATE ERROR:', dbErr);
                throw new Error('Aggiornamento database fallito: ' + dbErr.message);
            }

            // 4. Update local state
            setLocalItem(prev => ({ ...prev, pilot_photo: publicUrl }));

            alert('📸 Foto caricata e salvata correttamente!');
            onRefresh();
        } catch (err) {
            console.error('❌ PHOTO FLOW ERROR:', err);
            alert('❌ ERRORE: ' + err.message);
        } finally {
            setIsPhotoLoading(false);
        }
    }

    const translateLabel = (key) => {
        const map = {
            team_name: 'NOME TEAM', team_role: 'RUOLO', moto_details: 'MOTO',
            nome: 'NOME', cognome: 'COGNOME', email: 'EMAIL', telefono: 'TELEFONO',
            pilot_bio: 'BIOGRAFIA', pilot_photo: 'FOTO'
        };
        return map[key] || key.replace(/_/g, ' ').toUpperCase();
    };

    const regTabs = [
        { id: 'general', label: 'TEAM & MOTO', fields: ['team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation'] },
        { id: 'personal', label: 'ANAGRAFICA', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale'] },
        { id: 'bio', label: 'BIO PILOTA', fields: ['pilot_photo', 'pilot_bio'] },
        { id: 'requirements', label: 'REQUISITI', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine'] },
        { id: 'health', label: 'SALUTE', fields: ['food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] }
    ];

    const getPhotoUrl = (url) => {
        if (!url || typeof url !== 'string' || url === '{}' || !url.startsWith('http')) return null;
        return `${url}?t=${Date.now()}`;
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 450px', gap: '40px', animation: 'fadeIn 0.3s' }}>

            <div style={{ backgroundColor: '#111', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                {/* Header Dettaglio con Azioni */}
                <div style={{ padding: '40px', backgroundColor: '#000', borderBottom: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', color: '#FFCC00', margin: 0, fontWeight: 900 }}>{localItem.team_name || localItem.name}</h2>
                        <p style={{ color: '#E6007E', margin: '5px 0 0 0', fontWeight: 'bold' }}>ID: {item.id}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={handleDeleteItem} disabled={isDeleting} style={btnDelete}>
                            {isDeleting ? 'ELIMINAZIONE...' : '🗑️ ELIMINA'}
                        </button>
                        <button onClick={commitAllChanges} disabled={isSaving} style={btnCommit}>
                            {isSaving ? 'SALVATAGGIO...' : '💾 SALVA MODIFICHE'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', backgroundColor: '#0d0d12', overflowX: 'auto' }}>
                    {(type === 'registration' ? regTabs : [{ id: 'm', label: 'MESSAGGIO' }]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '50px', minHeight: '600px' }}>
                    {activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
                            {/* Photo Upload Section */}
                            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                                <div style={photoBigBox}>
                                    {isPhotoLoading ? (
                                        <div className="spinner">⌛</div>
                                    ) : getPhotoUrl(localItem.pilot_photo) ? (
                                        <img src={getPhotoUrl(localItem.pilot_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '3rem' }}>📷</span>
                                    )}
                                    <input type="file" onChange={handlePhotoUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                </div>
                                <div style={{ color: '#888', fontSize: '1.1rem' }}>
                                    <strong style={{ color: '#FFCC00' }}>FOTO PROFILO</strong><br />
                                    Clicca sul riquadro per caricare.<br />
                                    <span style={{ color: '#E6007E', fontSize: '0.8rem' }}>Salvataggio immediato.</span>
                                </div>
                            </div>

                            {/* Bio Editor Section */}
                            <div>
                                <label style={megaLabel}>BIOGRAFIA PILOTA (MODIFICA QUI)</label>
                                <textarea
                                    className="bio-textarea"
                                    value={localItem.pilot_bio || ''}
                                    onChange={e => setLocalItem({ ...localItem, pilot_bio: e.target.value })}
                                    style={ultraArea}
                                    placeholder="Raccontaci la tua storia..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                            {(type === 'registration' ? regTabs.find(t => t.id === activeTab).fields : ['message']).map(f => (
                                <div key={f} style={fBox}>
                                    <label style={megaLabel}>{translateLabel(f)}</label>
                                    <input
                                        type="text"
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
            <div style={{ backgroundColor: '#000', borderRadius: '40px', padding: '40px', border: '2px solid #E6007E', display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '800px' }}>
                <h3 style={{ color: '#E6007E', fontWeight: 900, fontSize: '1.4rem', marginBottom: '30px', letterSpacing: '2px' }}>LOG ATTIVITÀ CRM</h3>

                <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button onClick={addNote} style={btnYellowFull}>+ AGGIUNGI NOTA</button>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} style={darkInputFull} placeholder="Scrivi una nota di gestione..." />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                <div style={{ marginTop: '10px' }}>
                                    <textarea value={editNoteContent} onChange={e => setEditNoteContent(e.target.value)} style={{ ...darkInputFull, minHeight: '80px' }} />
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button onClick={() => updateNote(n.id)} style={btnSaveMini}>SALVA</button>
                                        <button onClick={() => setEditingNoteId(null)} style={btnCancelMini}>ANNULLA</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.6' }}>{n.content}</div>
                            )}
                        </div>
                    ))}
                    {notes.length === 0 && <p style={{ color: '#444', textAlign: 'center' }}>Nessuna nota presente.</p>}
                </div>
            </div>

            <style>{`
                .spinner { animation: rotate 1s linear infinite; font-size: 3rem; color: #FFCC00; }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .bio-textarea:focus { border-color: #FFCC00; box-shadow: 0 0 10px rgba(255,204,0,0.2); }
            `}</style>
        </div>
    );
}

const tabStyle = (active) => ({ flex: '0 0 auto', padding: '25px 30px', border: 'none', background: active ? '#1a1a1f' : 'transparent', color: active ? '#FFCC00' : '#666', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', borderBottom: active ? '4px solid #FFCC00' : 'none', transition: '0.2s' });
const megaLabel = { color: '#FFCC00', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' };
const fBox = { backgroundColor: '#1a1a1f', padding: '15px 20px', borderRadius: '16px', border: '1px solid #333', transition: '0.3s' };
const fInput = { width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' };
const ultraArea = { width: '100%', backgroundColor: '#1a1a1f', border: '2px solid #333', color: '#fff', fontSize: '1.3rem', padding: '25px', borderRadius: '24px', minHeight: '400px', outline: 'none', lineHeight: '1.6', fontFamily: 'inherit' };
const btnCommit = { backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(255,204,0,0.2)', transition: '0.2s' };
const btnDelete = { backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #ff4444', padding: '12px 25px', borderRadius: '12px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', transition: '0.2s' };
const btnYellowFull = { width: '100%', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' };
const darkInputFull = { width: '100%', backgroundColor: '#16161a', border: '1px solid #333', color: '#fff', padding: '20px', borderRadius: '16px', fontSize: '1.1rem', outline: 'none', resize: 'none' };
const noteBox = { backgroundColor: '#1a1a1f', padding: '25px', borderRadius: '20px', borderLeft: '5px solid #FFCC00', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' };
const noteHeader = { fontSize: '0.8rem', color: '#888', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' };
const photoBigBox = { width: '250px', height: '250px', backgroundColor: '#000', border: '4px dashed #FFCC00', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 20px rgba(255,204,0,0.1)' };
const btnSaveMini = { backgroundColor: '#FFCC00', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' };
const btnCancelMini = { backgroundColor: '#333', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' };
