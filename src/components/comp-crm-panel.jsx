/**
 * 🧬 COMPONENT: CRM Detail Panel v3.0
 * Goal: Premium Edition with Tabs, Editing, and Bio Focus
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isNoteLoading, setIsNoteLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const noteTable = type === 'registration' ? 'registration_notes' : 'message_notes';
    const foreignKey = type === 'registration' ? 'registration_id' : 'message_id';

    useEffect(() => {
        if (item) {
            setLocalItem(item);
            fetchNotes();
        }
    }, [item]);

    async function fetchNotes() {
        const { data, error } = await supabase
            .from(noteTable)
            .select('*')
            .eq(foreignKey, item.id)
            .order('created_at', { ascending: true });
        if (!error) setNotes(data);
        else console.error('Fetch Notes Error:', error);
    }

    async function addNote() {
        if (!newNote.trim()) return;
        setIsNoteLoading(true);
        const { error } = await supabase.from(noteTable).insert([
            { [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }
        ]);
        if (error) {
            alert('Errore SQL: Verifica di aver creato la tabella registration_notes su Supabase.');
        } else {
            setNewNote('');
            fetchNotes();
        }
        setIsNoteLoading(false);
    }

    async function saveField(key) {
        const table = type === 'registration' ? 'registrations' : 'messages';
        const { error } = await supabase.from(table).update({ [key]: tempValue }).eq('id', item.id);
        if (!error) {
            setLocalItem({ ...localItem, [key]: tempValue });
            setEditingField(null);
            onRefresh();
        } else {
            alert('Errore aggiornamento: ' + error.message);
        }
    }

    async function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const fileName = `${item.id}-${Date.now()}.${file.name.split('.').pop()}`;
            const { error: upErr } = await supabase.storage.from('registrations').upload(`photos/${fileName}`, file);
            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage.from('registrations').getPublicUrl(`photos/${fileName}`);
            await supabase.from('registrations').update({ pilot_photo: publicUrl }).eq('id', item.id);

            setLocalItem({ ...localItem, pilot_photo: publicUrl });
            onRefresh();
        } catch (err) { alert('Upload Fallito: ' + err.message); }
    }

    const regTabs = [
        { id: 'general', label: 'TEAM & MOTO', fields: ['team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation'] },
        { id: 'personal', label: 'ANAGRAFICA', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale', 'citta_nascita', 'citta_residenza', 'via_residenza', 'civico_residenza', 'cap_residenza'] },
        { id: 'awareness', label: 'REQUISITI', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine'] },
        { id: 'health', label: 'SALUTE', fields: ['food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] },
        { id: 'bio', label: 'PILOT BIO', fields: ['pilot_photo', 'pilot_bio'] }
    ];

    const renderCell = (key, value) => {
        if (editingField === key) {
            return (
                <div style={{ display: 'flex', gap: '5px' }}>
                    <input autoFocus value={tempValue} onChange={(e) => setTempValue(e.target.value)} style={inputSmall} />
                    <button onClick={() => saveField(key)} style={btnMini}>ok</button>
                    <button onClick={() => setEditingField(null)} style={btnMiniX}>x</button>
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ color: value ? '#fff' : '#444' }}>{value || '-'}</span>
                <span onClick={() => { setEditingField(key); setTempValue(value || ''); }} style={{ cursor: 'pointer', opacity: 0.3 }}>✏️</span>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', animation: 'fadeIn 0.4s' }}>

            <div style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                {/* Header Dettaglio */}
                <div style={{ padding: '40px', background: 'linear-gradient(135deg, #0d0d12 0%, #1a1a23 100%)', color: '#fff' }}>
                    <h2 style={{ fontSize: '2.2rem', color: '#FFCC00', margin: 0, fontWeight: 900 }}>{localItem.team_name || localItem.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', margin: '10px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>Dettaglio {type}</p>
                </div>

                {/* Tab Meccanismo Premium */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                    {(type === 'registration' ? regTabs : [{ id: 'msg', label: 'MESSAGGIO' }]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabButtonStyle(activeTab === t.id)}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '40px' }}>
                    {activeTab === 'bio' ? (
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <div style={photoDropZone}>
                                {localItem.pilot_photo ? <img src={`${localItem.pilot_photo}?t=${Date.now()}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
                                <input type="file" onChange={handlePhotoUpload} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>BIOGRAFIA PILOTA</label>
                                {editingField === 'pilot_bio' ? (
                                    <>
                                        <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} style={{ ...inputSmall, minHeight: '200px' }} />
                                        <button onClick={() => saveField('pilot_bio')} style={btnMini}>SALVA BIO</button>
                                    </>
                                ) : (
                                    <div onClick={() => { setEditingField('pilot_bio'); setTempValue(localItem.pilot_bio || ''); }} style={{ backgroundColor: '#f8f8f8', padding: '20px', borderRadius: '12px', border: '1px solid #eee', cursor: 'pointer', whiteSpace: 'pre-line' }}>
                                        {localItem.pilot_bio || 'Clicca per aggiungere biografia...'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {(type === 'registration' ? regTabs.find(t => t.id === activeTab).fields : ['message']).map(f => (
                                <div key={f} style={fieldBox}>
                                    <label style={labelStyle}>{f.replace(/_/g, ' ')}</label>
                                    {renderCell(f, localItem[f])}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CRM ACTIVITY - Sidebar Dark Premium */}
            <div style={{ backgroundColor: '#131318', borderRadius: '24px', padding: '30px', color: '#fff' }}>
                <h3 style={{ fontSize: '0.8rem', color: '#FFCC00', fontWeight: 900, letterSpacing: '2px', marginBottom: '30px' }}>LOG GESTIONE CRM</h3>
                <div style={{ height: '500px', overflowY: 'auto', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', borderLeft: '3px solid #FFCC00' }}>
                            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>{new Date(n.created_at).toLocaleString()}</div>
                            <div style={{ fontSize: '0.9rem' }}>{n.content}</div>
                        </div>
                    ))}
                </div>
                <div>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Aggiungi nota..." style={darkTeaStyle} />
                    <button onClick={addNote} disabled={isNoteLoading} style={btnYellowFull}>{isNoteLoading ? '...' : '+ AGGIUNGI NOTA'}</button>
                </div>
            </div>
        </div>
    );
}

const tabButtonStyle = (active) => ({ flex: 1, padding: '20px', border: 'none', backgroundColor: active ? '#fff' : 'transparent', color: active ? '#000' : '#888', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', borderBottom: active ? '4px solid #FFCC00' : 'none', transition: '0.2s' });
const fieldBox = { backgroundColor: '#fdfdfd', border: '1px solid #eee', padding: '15px', borderRadius: '14px' };
const labelStyle = { display: 'block', fontSize: '0.6rem', color: '#FFCC00', fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase' };
const inputSmall = { width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #FFCC00', backgroundColor: '#fff', fontSize: '0.9rem', outline: 'none' };
const darkTeaStyle = { width: '100%', backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '12px', minHeight: '80px', marginBottom: '10px', resize: 'none' };
const btnYellowFull = { width: '100%', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '15px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' };
const btnMini = { backgroundColor: '#FFCC00', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900 };
const btnMiniX = { backgroundColor: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' };
const photoDropZone = { width: '150px', height: '150px', backgroundColor: '#eee', borderRadius: '20px', border: '2px dashed #FFCC00', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontSize: '2rem' };
