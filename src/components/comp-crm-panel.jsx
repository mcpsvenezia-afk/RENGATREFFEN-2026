/**
 * 🧬 COMPONENT: CRM Detail Panel v3.6
 * Goal: PREMIUM UI, TOAST NOTIFICATIONS, ROBUST STORAGE & DB PERSISTENCE
 * Logic: Strictly separates local state from DB sync, handles errors with custom UI.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    // 1. STATE MANAGEMENT
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    // 2. UI STATES (Premium Notifications)
    const [status, setStatus] = useState({ type: '', message: '', visible: false });
    const [loading, setLoading] = useState({ saving: false, deleting: false, photo: false });

    const noteTable = type === 'registration' ? 'registration_notes' : 'message_notes';
    const foreignKey = type === 'registration' ? 'registration_id' : 'message_id';

    // 3. INITIALIZATION
    useEffect(() => {
        if (item) {
            setLocalItem(item);
            fetchNotes();
        }
    }, [item]);

    // 4. HELPER: Show Premium Toast
    const showToast = (type, message) => {
        setStatus({ type, message, visible: true });
        setTimeout(() => setStatus(prev => ({ ...prev, visible: false })), 4000);
    };

    // 5. DATA FETCHING
    async function fetchNotes() {
        if (!item?.id) return;
        const { data, error } = await supabase
            .from(noteTable)
            .select('*')
            .eq(foreignKey, item.id)
            .order('created_at', { ascending: false });
        if (!error) setNotes(data);
    }

    // 6. ACTION: COMMIT ALL CHANGES
    async function commitAllChanges() {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const table = type === 'registration' ? 'registrations' : 'messages';

            // 🛡️ DATA SANITIZATION (Strict Whitelist)
            // We only update fields that are safe and expected in the DB
            const allowedFields = [
                'team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation',
                'nome', 'cognome', 'email', 'telefono', 'codice_fiscale', 'citta_nascita',
                'citta_residenza', 'via_residenza', 'civico_residenza', 'cap_residenza',
                'pilot_bio', 'pilot_photo', 'food_preferences', 'emergency_contact_phone',
                'emergency_contact_info'
            ];

            const updateData = {};
            allowedFields.forEach(field => {
                if (localItem[field] !== undefined) {
                    updateData[field] = localItem[field];
                }
            });

            console.log('🧬 DB UPDATE PAYLOAD:', updateData);

            const { error } = await supabase
                .from(table)
                .update(updateData)
                .eq('id', item.id);

            if (error) throw error;

            showToast('success', 'DATI AGGIORNATI CON SUCCESSO NEL DATABASE');
            onRefresh();
        } catch (err) {
            console.error('❌ SQL UPDATE ERROR:', err);
            showToast('error', 'ERRORE DI SALVATAGGIO: ' + (err.message || 'Verifica la connessione o i permessi RLS.'));
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    }

    // 7. ACTION: DELETE RECORD
    async function handleDeleteItem() {
        // We use a custom styled prompt logic or simple confirm for now, but handle it better
        if (!window.confirm(`⚠️ ELIMINAZIONE DEFINITIVA: Procedere con la cancellazione di "${localItem.team_name || localItem.name}"?`)) return;

        setLoading(prev => ({ ...prev, deleting: true }));
        try {
            const table = type === 'registration' ? 'registrations' : 'messages';

            // Note should cascade if DB is configured correctly, but we attempt the delete
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            showToast('success', 'RECORD ELIMINATO CORRETTAMENTE');
            setTimeout(() => {
                onRefresh();
                onBack();
            }, 1000);
        } catch (err) {
            console.error('❌ DELETE ERROR:', err);
            showToast('error', 'CANCELLAZIONE FALLITA: ' + err.message);
        } finally {
            setLoading(prev => ({ ...prev, deleting: false }));
        }
    }

    // 8. ACTION: PHOTO UPLOAD
    async function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(prev => ({ ...prev, photo: true }));
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${item.id}-${Date.now()}.${fileExt}`;
            const filePath = `photos/${fileName}`;

            // A. Upload to Storage
            const { error: upErr } = await supabase.storage
                .from('registrations')
                .upload(filePath, file);

            if (upErr) throw new Error('Caricamento Storage fallito: ' + upErr.message);

            // B. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('registrations')
                .getPublicUrl(filePath);

            // C. Sync to Database immediately (to avoid data loss)
            const { error: dbErr } = await supabase
                .from('registrations')
                .update({ pilot_photo: publicUrl })
                .eq('id', item.id);

            if (dbErr) throw new Error('Sincronizzazione DB fallita: ' + dbErr.message);

            // D. Refresh UI
            setLocalItem(prev => ({ ...prev, pilot_photo: publicUrl }));
            showToast('success', 'FOTO CARICATA E SALVATA');
            onRefresh();
        } catch (err) {
            console.error('❌ PHOTO UPLOAD ERROR:', err);
            showToast('error', err.message);
        } finally {
            setLoading(prev => ({ ...prev, photo: false }));
        }
    }

    // 9. NOTE MANAGEMENT
    async function addNote() {
        if (!newNote.trim()) return;
        const { error } = await supabase.from(noteTable).insert([{ [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }]);
        if (!error) {
            setNewNote('');
            fetchNotes();
            showToast('success', 'NOTA AGGIUNTA');
        } else {
            showToast('error', 'ERRORE NOTA: ' + error.message);
        }
    }

    const regTabs = [
        { id: 'general', label: 'TEAM & MOTO', fields: ['team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation'] },
        { id: 'personal', label: 'ANAGRAFICA', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale'] },
        { id: 'bio', label: 'BIO PILOTA', fields: ['pilot_photo', 'pilot_bio'] },
        { id: 'requirements', label: 'REQUISITI', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine'] },
        { id: 'health', label: 'SALUTE', fields: ['food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] }
    ];

    const getPhotoDisplayUrl = (url) => {
        if (!url || typeof url !== 'string' || url === '{}' || !url.startsWith('http')) return null;
        return `${url}?t=${Date.now()}`;
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 450px', gap: '40px', position: 'relative' }}>

            {/* 🥯 PREMIUM TOAST NOTIFICATION */}
            {status.visible && (
                <div style={toastContainer(status.type)}>
                    <span style={{ marginRight: '10px' }}>{status.type === 'success' ? '✅' : '❌'}</span>
                    {status.message}
                </div>
            )}

            {/* LEFT COLUMN: DATA & FORMS */}
            <div style={{ backgroundColor: '#111', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>

                {/* Header Dettaglio */}
                <div style={{ padding: '40px 50px', backgroundColor: '#000', borderBottom: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', color: '#FFCC00', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>{localItem.team_name || localItem.name}</h2>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px' }}>
                            <span style={idBadge}>ID: {item.id.slice(0, 18)}...</span>
                            <span style={typeBadge}>{type.toUpperCase()}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                            onClick={handleDeleteItem}
                            disabled={loading.deleting}
                            style={btnDeleteStyle(loading.deleting)}
                        >
                            {loading.deleting ? 'ELIMINAZIONE...' : '🗑️ ELIMINA'}
                        </button>
                        <button
                            onClick={commitAllChanges}
                            disabled={loading.saving}
                            style={btnSaveStyle(loading.saving)}
                        >
                            {loading.saving ? 'SALVATAGGIO...' : '💾 SALVA MODIFICHE'}
                        </button>
                    </div>
                </div>

                {/* Tabs Professional Navigation */}
                <div style={{ display: 'flex', backgroundColor: '#0d0d12', borderBottom: '1px solid #222' }}>
                    {(type === 'registration' ? regTabs : [{ id: 'm', label: 'MESSAGGIO' }]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '50px', minHeight: '650px' }}>
                    {activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '50px' }}>
                            <div style={{ display: 'flex', gap: '50px', alignItems: 'center', backgroundColor: '#1a1a1f', padding: '30px', borderRadius: '32px', border: '1px solid #333' }}>
                                <div style={photoDropBox}>
                                    {loading.photo ? (
                                        <div className="spinner">⌛</div>
                                    ) : getPhotoDisplayUrl(localItem.pilot_photo) ? (
                                        <img src={getPhotoDisplayUrl(localItem.pilot_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '3rem', opacity: 0.3 }}>📷</span>
                                    )}
                                    <input type="file" onChange={handlePhotoUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                </div>
                                <div>
                                    <h4 style={{ color: '#FFCC00', margin: '0 0 10px 0', fontSize: '1.2rem' }}>FOTO PROFILO PILOTA</h4>
                                    <p style={{ color: '#888', margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        Clicca sul quadrato per caricare la foto ufficiale.<br />
                                        Misure consigliate: <span style={{ color: '#fff' }}>600x600 px (Quadrata)</span>.<br />
                                        <span style={{ color: '#E6007E', fontWeight: 'bold' }}>Il salvataggio è immediato.</span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label style={megaLabelStyle}>BIOGRAFIA PILOTA (CV MOTOCICLISTICO)</label>
                                <textarea
                                    value={localItem.pilot_bio || ''}
                                    onChange={e => setLocalItem({ ...localItem, pilot_bio: e.target.value })}
                                    style={ultraTextAreaStyle}
                                    placeholder="Raccontaci della tua storia sulle due ruote..."
                                />
                                <div style={{ textAlign: 'right', marginTop: '10px', color: '#555', fontSize: '0.8rem' }}>
                                    {(localItem.pilot_bio || '').length} / 500 caratteri
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                            {(type === 'registration' ? regTabs.find(t => t.id === activeTab).fields : ['message']).map(f => (
                                <div key={f} style={fieldContainerStyle}>
                                    <label style={megaLabelStyle}>{f.replace(/_/g, ' ').toUpperCase()}</label>
                                    {f === 'message' ? (
                                        <div style={{ color: '#fff', fontSize: '1.2rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{localItem[f]}</div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={localItem[f] || ''}
                                            onChange={e => setLocalItem({ ...localItem, [f]: e.target.value })}
                                            style={premiumInputStyle}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: CRM NOTES SIDEBAR */}
            <div style={{ backgroundColor: '#000', borderRadius: '40px', padding: '40px', border: '2px solid #E6007E', display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '900px', boxShadow: '0 20px 80px rgba(230,0,126,0.1)' }}>
                <h3 style={{ color: '#E6007E', fontWeight: 900, fontSize: '1.5rem', marginBottom: '30px', letterSpacing: '2px', textTransform: 'uppercase' }}>LOG ATTIVITÀ CRM</h3>

                {/* Note Action Center */}
                <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <button onClick={addNote} style={btnAddNoteStyle}>+ AGGIUNGI NOTA</button>
                    <textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        style={darkInputArea}
                        placeholder="Annotazioni di gestione..."
                    />
                </div>

                {/* Scrollable Note List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '25px', paddingRight: '10px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={noteItemBox}>
                            <div style={noteItemHeader}>
                                <span>{new Date(n.created_at).toLocaleString('it-IT')}</span>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <span style={{ cursor: 'pointer', opacity: 0.5 }}>✏️</span>
                                    <span onClick={() => { if (window.confirm('Cancellare nota?')) supabase.from(noteTable).delete().eq('id', n.id).then(fetchNotes) }} style={{ cursor: 'pointer', opacity: 0.5 }}>🗑️</span>
                                </div>
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.6' }}>{n.content}</div>
                        </div>
                    ))}
                    {notes.length === 0 && <p style={{ color: '#444', textAlign: 'center', marginTop: '40px' }}>Nessuna nota registrata.</p>}
                </div>
            </div>

            {/* 🌀 GLOBAL SPINNER STYLES */}
            <style>{`
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinner { animation: rotate 1s linear infinite; font-size: 3rem; color: #FFCC00; }
                @keyframes fadeInToast { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #333; borderRadius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
        </div>
    );
}

// PREMIUM STYLES CONSTANTS
const toastContainer = (type) => ({
    position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: type === 'success' ? '#4CAF50' : '#E6007E',
    color: '#fff', padding: '15px 40px', borderRadius: '50px', fontWeight: 900,
    boxShadow: '0 15px 40px rgba(0,0,0,0.4)', zIndex: 10000,
    animation: 'fadeInToast 0.3s ease-out', border: '2px solid rgba(255,255,255,0.2)'
});

const idBadge = { backgroundColor: '#111', color: '#666', padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', border: '1px solid #333', fontFamily: 'monospace' };
const typeBadge = { backgroundColor: '#E6007E', color: '#fff', padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900 };

const btnSaveStyle = (loading) => ({ backgroundColor: loading ? '#333' : '#FFCC00', color: '#000', border: 'none', padding: '15px 35px', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer', boxShadow: '0 10px 20px rgba(255,204,0,0.2)', transition: '0.3s' });
const btnDeleteStyle = (loading) => ({ backgroundColor: 'transparent', color: '#ff4444', border: '2px solid #ff4444', padding: '15px 35px', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer', transition: '0.3s' });

const tabStyle = (active) => ({ flex: 1, padding: '25px', border: 'none', background: active ? '#1a1a1f' : 'transparent', color: active ? '#FFCC00' : '#666', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', borderBottom: active ? '4px solid #FFCC00' : '4px solid transparent', transition: '0.3s' });

const fieldContainerStyle = { backgroundColor: '#1a1a1f', padding: '20px 25px', borderRadius: '20px', border: '1px solid #333' };
const megaLabelStyle = { color: '#FFCC00', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', display: 'block', marginBottom: '12px', opacity: 0.8 };
const premiumInputStyle = { width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.3rem', fontWeight: 'bold', outline: 'none' };

const photoDropBox = { width: '220px', height: '220px', backgroundColor: '#000', border: '4px dashed #FFCC00', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };

const ultraTextAreaStyle = { width: '100%', backgroundColor: '#1a1a1f', border: '2px solid #333', color: '#fff', fontSize: '1.4rem', padding: '30px', borderRadius: '32px', minHeight: '400px', outline: 'none', lineHeight: '1.6', fontFamily: 'inherit', resize: 'vertical' };

const btnAddNoteStyle = { width: '100%', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,204,0,0.2)' };
const darkInputArea = { width: '100%', backgroundColor: '#1a1a1f', border: '1px solid #333', color: '#fff', padding: '20px', borderRadius: '20px', fontSize: '1.1rem', outline: 'none', minHeight: '120px', resize: 'none' };

const noteItemBox = { backgroundColor: '#111', padding: '25px', borderRadius: '24px', borderLeft: '6px solid #FFCC00', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' };
const noteItemHeader = { color: '#FFCC00', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' };
