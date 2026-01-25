/**
 * 🧬 COMPONENT: CRM Detail Panel v3.2
 * Goal: FULL ITALIAN, FIXED PHOTO LOGIC, BIO EDITING
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
        const { data, error } = await supabase.from(noteTable).select('*').eq(foreignKey, item.id).order('created_at', { ascending: true });
        if (!error) setNotes(data);
    }

    async function addNote() {
        if (!newNote.trim()) return;
        setIsNoteLoading(true);
        const { error } = await supabase.from(noteTable).insert([{ [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }]);
        if (!error) { setNewNote(''); fetchNotes(); }
        else alert('Errore salvataggio nota: ' + error.message);
        setIsNoteLoading(false);
    }

    async function saveField(key) {
        const table = type === 'registration' ? 'registrations' : 'messages';
        const { error } = await supabase.from(table).update({ [key]: tempValue }).eq('id', item.id);
        if (!error) {
            setLocalItem({ ...localItem, [key]: tempValue });
            setEditingField(null);
            onRefresh();
        } else alert('Errore: ' + error.message);
    }

    // Traduzione etichette in Italiano
    const translateLabel = (key) => {
        const map = {
            team_name: 'NOME TEAM', team_role: 'RUOLO NEL TEAM', moto_details: 'DETTAGLI MOTO',
            is_mcps_member: 'SOCIO MCPS', mcps_delegation: 'DELEGAZIONE MCPS',
            nome: 'NOME', cognome: 'COGNOME', email: 'EMAIL', telefono: 'TELEFONO',
            codice_fiscale: 'CODICE FISCALE', citta_nascita: 'CITTÀ DI NASCITA',
            citta_residenza: 'CITTÀ RESIDENZA', via_residenza: 'VIA RESIDENZA',
            civico_residenza: 'N. CIVICO', cap_residenza: 'CAP',
            has_roadbook_skill: 'COMPETENZA ROADBOOK', understand_treasure_hunt: 'CAPITO CACCIA AL TESORO',
            understand_knobby_tires: 'CAPITO GOMME TASSELLATE', understand_team_of_2: 'CAPITO TEAM DA 2',
            understand_donation_no_refund: 'CAPITO NO RIMBORSO', understand_rain_or_shine: 'CAPITO QUALSIASI METEO',
            food_preferences: 'PREFERENZE ALIMENTARI', emergency_contact_phone: 'TEL. EMERGENZA',
            emergency_contact_info: 'INFO CONTATTO EMERGENZA', pilot_photo: 'FOTO PILOTA', pilot_bio: 'BIOGRAFIA PILOTA',
            message: 'MESSAGGIO'
        };
        return map[key] || key.replace(/_/g, ' ').toUpperCase();
    };

    const regTabs = [
        { id: 'general', label: 'TEAM & MOTO', fields: ['team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation'] },
        { id: 'personal', label: 'ANAGRAFICA', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale', 'citta_nascita', 'citta_residenza', 'via_residenza', 'civico_residenza', 'cap_residenza'] },
        { id: 'requirements', label: 'REQUISITI', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine'] },
        { id: 'health', label: 'SALUTE', fields: ['food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] },
        { id: 'bio', label: 'BIO PILOTA', fields: ['pilot_photo', 'pilot_bio'] }
    ];

    const renderField = (key, value) => {
        if (editingField === key) {
            return (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input autoFocus value={tempValue} onChange={(e) => setTempValue(e.target.value)} style={ultraInput} />
                    <button onClick={() => saveField(key)} style={btnSave}>OK</button>
                    <button onClick={() => setEditingField(null)} style={btnCancel}>X</button>
                </div>
            )
        }
        return (
            <div onClick={() => { setEditingField(key); setTempValue(value || ''); }} style={displayBox}>
                <span style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold', display: 'block' }}>{value || '-'}</span>
                <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>✏️</span>
            </div>
        )
    };

    // Validazione URL Foto per evitare 404 da oggetti vuoti {}
    const getPhotoUrl = (url) => {
        if (!url || typeof url !== 'string' || url === '{}' || !url.startsWith('http')) return null;
        return `${url}?t=${Date.now()}`;
    };

    return (
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '40px', animation: 'fadeIn 0.3s' }}>

            {/* BLOCCO PRINCIPALE DATI */}
            <div style={{ backgroundColor: '#1a1a1f', borderRadius: '32px', border: '1px solid #333', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                {/* Header Dettaglio */}
                <div style={{ padding: '50px', backgroundColor: '#000', borderBottom: '1px solid #333' }}>
                    <h2 style={{ fontSize: '3rem', color: '#FFCC00', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>{localItem.team_name || localItem.name}</h2>
                    <p style={{ color: '#E6007E', margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '4px' }}>TIPO: {type.toUpperCase()} | ID: {item.id.slice(0, 8)}</p>
                </div>

                {/* Tabs Ultra-Visibili */}
                <div style={{ display: 'flex', backgroundColor: '#0d0d12', gap: '2px' }}>
                    {(type === 'registration' ? regTabs : [{ id: 'm', label: 'MESSAGGIO' }]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
                    ))}
                </div>

                {/* Area Contenuto */}
                <div style={{ padding: '50px', minHeight: '500px' }}>
                    {activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
                            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                                <div style={photoBigBox}>
                                    {getPhotoUrl(localItem.pilot_photo) ? (
                                        <img src={getPhotoUrl(localItem.pilot_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '3rem' }}>📷</span>
                                    )}
                                    <input type="file" onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const fn = `${item.id}-${Date.now()}.${file.name.split('.').pop()}`;
                                            await supabase.storage.from('registrations').upload(`photos/${fn}`, file);
                                            const { data: { publicUrl } } = supabase.storage.from('registrations').getPublicUrl(`photos/${fn}`);
                                            await supabase.from('registrations').update({ pilot_photo: publicUrl }).eq('id', item.id);
                                            setLocalItem({ ...localItem, pilot_photo: publicUrl });
                                            onRefresh();
                                        }
                                    }} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                </div>
                                <div style={{ color: '#888', fontSize: '1rem' }}>
                                    <strong style={{ color: '#FFCC00' }}>FOTO PROFILO PILOTA</strong><br />
                                    Clicca sul riquadro per caricare o cambiare.<br />
                                    Formato consigliato: 1:1 Quadrato.
                                </div>
                            </div>
                            <div>
                                <label style={megaLabel}>BIOGRAFIA PILOTA (MODIFICABILE)</label>
                                {editingField === 'pilot_bio' ? (
                                    <>
                                        <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} style={ultraArea} />
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <button onClick={() => saveField('pilot_bio')} style={btnYellowFull}>SALVA MODIFICHE BIO</button>
                                            <button onClick={() => setEditingField(null)} style={{ ...btnYellowFull, backgroundColor: '#333', color: '#fff' }}>ANNULLA</button>
                                        </div>
                                    </>
                                ) : (
                                    <div onClick={() => { setEditingField('pilot_bio'); setTempValue(localItem.pilot_bio || ''); }} style={displayBioBox}>
                                        {localItem.pilot_bio || 'Nessuna biografia inserita. Clicca qui per scriverne una.'}
                                        <span style={{ position: 'absolute', right: '30px', top: '30px', opacity: 0.5, fontSize: '1rem' }}>✏️ MODIFICA</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                            {(type === 'registration' ? regTabs.find(t => t.id === activeTab).fields : ['message']).map(f => (
                                <div key={f}>
                                    <label style={megaLabel}>{translateLabel(f)}</label>
                                    {renderField(f, localItem[f])}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR CRM */}
            <div style={{ backgroundColor: '#0d0d12', borderRadius: '32px', padding: '40px', border: '1px solid #E6007E', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: '#E6007E', fontWeight: 900, letterSpacing: '2px', marginBottom: '30px', fontSize: '1.2rem' }}>LOG ATTIVITÀ CRM</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={{ backgroundColor: '#1a1a1f', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #FFCC00' }}>
                            <div style={{ fontSize: '0.8rem', color: '#ffcc00', fontWeight: 'bold', marginBottom: '10px' }}>{new Date(n.created_at).toLocaleString()}</div>
                            <div style={{ fontSize: '1.1rem', color: '#fff' }}>{n.content}</div>
                        </div>
                    ))}
                    {notes.length === 0 && <p style={{ color: '#444', textAlign: 'center' }}>Nessuna nota presente.</p>}
                </div>
                <div>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} style={darkInputFull} placeholder="Scrivi una nota di gestione..." />
                    <button onClick={addNote} disabled={isNoteLoading} style={btnYellowFull}>{isNoteLoading ? '...' : '+ AGGIUNGI NOTA'}</button>
                </div>
            </div>
        </div>
    );
}

const tabStyle = (active) => ({ flex: 1, padding: '25px', border: 'none', background: active ? '#1a1a1f' : 'transparent', color: active ? '#FFCC00' : '#444', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', borderBottom: active ? '3px solid #FFCC00' : '3px solid transparent', transition: '0.3s' });
const megaLabel = { color: '#FFCC00', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '12px' };
const displayBox = { backgroundColor: '#26262e', padding: '20px', borderRadius: '16px', border: '1px solid #333', position: 'relative', cursor: 'pointer', minHeight: '60px', display: 'flex', alignItems: 'center' };
const ultraInput = { flex: 1, backgroundColor: '#000', border: '2px solid #FFCC00', color: '#fff', fontSize: '1.2rem', padding: '10px', borderRadius: '8px', outline: 'none' };
const ultraArea = { width: '100%', backgroundColor: '#000', border: '2px solid #FFCC00', color: '#fff', fontSize: '1.2rem', padding: '20px', borderRadius: '16px', outline: 'none', minHeight: '300px', marginBottom: '20px', fontFamily: 'inherit' };
const displayBioBox = { backgroundColor: '#26262e', border: '1px solid #333', padding: '30px', borderRadius: '24px', fontSize: '1.4rem', color: '#fff', lineHeight: '1.6', cursor: 'pointer', position: 'relative', whiteSpace: 'pre-wrap' };
const btnSave = { backgroundColor: '#FFCC00', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 900, padding: '0 15px', cursor: 'pointer' };
const btnCancel = { backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer' };
const btnYellowFull = { width: '100%', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' };
const darkInputFull = { width: '100%', backgroundColor: '#1a1a1f', border: '1px solid #333', color: '#fff', padding: '20px', borderRadius: '16px', minHeight: '100px', marginBottom: '10px', resize: 'none', outline: 'none', fontSize: '1.1rem' };
const photoBigBox = { width: '220px', height: '220px', backgroundColor: '#000', border: '3px dashed #FFCC00', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' };
