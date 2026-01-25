/**
 * 🧬 COMPONENT: CRM Detail Panel v3.8
 * Goal: PREMIUM UI (NO BROWSER POPUPS), CUSTOM MODALS, ULTRA-STABLE SYNC
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [activeTab, setActiveTab] = useState(type === 'registration' ? 'management' : 'm');

    // UI STATES
    const [status, setStatus] = useState({ type: '', message: '', visible: false });
    const [loading, setLoading] = useState({ saving: false, deleting: false, photo: false });

    // 🧬 PREMIUM MODAL STATE
    const [modal, setModal] = useState({ visible: false, title: '', message: '', onConfirm: null, isDanger: false });

    const noteTable = type === 'registration' ? 'registration_notes' : 'message_notes';
    const foreignKey = type === 'registration' ? 'registration_id' : 'message_id';

    useEffect(() => {
        if (item) {
            setLocalItem(item);
            fetchNotes();
            setActiveTab(type === 'registration' ? 'management' : 'm');
        }
    }, [item, type]);

    const showToast = (type, message) => {
        setStatus({ type, message, visible: true });
        setTimeout(() => setStatus(prev => ({ ...prev, visible: false })), 4000);
    };

    const askConfirm = (title, message, onConfirm, isDanger = false) => {
        setModal({ visible: true, title, message, onConfirm, isDanger });
    };

    async function fetchNotes() {
        if (!item?.id) return;
        const { data, error } = await supabase.from(noteTable).select('*').eq(foreignKey, item.id).order('created_at', { ascending: false });
        if (!error) setNotes(data);
    }

    async function commitAllChanges() {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const table = type === 'registration' ? 'registrations' : 'messages';
            const allowedFields = [
                'team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation',
                'nome', 'cognome', 'email', 'telefono', 'codice_fiscale', 'citta_nascita',
                'citta_residenza', 'via_residenza', 'civico_residenza', 'cap_residenza',
                'pilot_bio', 'pilot_photo', 'food_preferences', 'emergency_contact_phone',
                'emergency_contact_info', 'is_paid', 'payment_date', 'bib_number', 'departure_time',
                'secondo_nome', 'secondo_cognome', 'secondo_cellulare'
            ];
            const updateData = {};
            allowedFields.forEach(f => { if (localItem[f] !== undefined) updateData[f] = localItem[f]; });
            const { error } = await supabase.from(table).update(updateData).eq('id', item.id);
            if (error) throw error;
            showToast('success', 'SINCRE CORRETTA');
            onRefresh();
        } catch (err) { showToast('error', 'ERRORE: ' + err.message); } finally { setLoading(prev => ({ ...prev, saving: false })); }
    }

    async function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(prev => ({ ...prev, photo: true }));
        try {
            const fn = `${item.id}-${Date.now()}.${file.name.split('.').pop()}`;
            await supabase.storage.from('registrations').upload(`photos/${fn}`, file);
            const { data: { publicUrl } } = supabase.storage.from('registrations').getPublicUrl(`photos/${fn}`);
            await supabase.from('registrations').update({ pilot_photo: publicUrl }).eq('id', item.id);
            setLocalItem(prev => ({ ...prev, pilot_photo: publicUrl }));
            showToast('success', 'FOTO SALVATA');
            onRefresh();
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, photo: false })); }
    }

    async function addNote() {
        if (!newNote.trim()) return;
        const { error } = await supabase.from(noteTable).insert([{ [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }]);
        if (!error) { setNewNote(''); fetchNotes(); showToast('success', 'NOTA AGGIUNTA'); }
    }

    const regTabs = [
        { id: 'management', label: 'GESTIONE EVENTO', fields: [] },
        { id: 'general', label: 'TEAM & MOTO', fields: ['team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation'] },
        { id: 'personal', label: 'ANAGRAFICA PILOTA', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale'] },
        { id: 'bio', label: 'BIO PILOTA', fields: ['pilot_photo', 'pilot_bio'] },
        { id: 'requirements', label: 'REQUISITI', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine'] },
        { id: 'health', label: 'SALUTE', fields: ['food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] }
    ];

    const getPhotoDisplayUrl = (url) => (!url || url === '{}' || typeof url !== 'string' || !url.startsWith('http')) ? null : `${url}?t=${Date.now()}`;

    return (
        <div style={{ maxWidth: '1450px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 450px', gap: '40px', position: 'relative' }}>

            {/* 🥯 TOAST NOTIFICATION */}
            {status.visible && <div style={toastStyle(status.type)}>{status.type === 'success' ? '✅ ' : '❌ '}{status.message}</div>}

            {/* 🧬 PREMIUM MODAL OVERLAY */}
            {modal.visible && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ color: modal.isDanger ? '#ff4444' : '#FFCC00', marginTop: 0, fontSize: '1.5rem', fontWeight: 900 }}>{modal.title}</h3>
                        <p style={{ color: '#fff', fontSize: '1.1rem', margin: '20px 0 30px 0', lineHeight: '1.6' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal({ ...modal, visible: false })} style={btnModalCancel}>ANNULLA</button>
                            <button onClick={() => { modal.onConfirm(); setModal({ ...modal, visible: false }); }} style={modal.isDanger ? btnModalDanger : btnModalConfirm}>CONFERMA</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ backgroundColor: '#111', borderRadius: '40px', border: '1px solid #333', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '40px 50px', backgroundColor: '#000', borderBottom: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', color: '#FFCC00', margin: 0, fontWeight: 900 }}>{localItem.team_name || localItem.name}</h2>
                        <div style={{ marginTop: '10px' }}><span style={idBadge}>{type.toUpperCase()}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button
                            onClick={() => askConfirm('ELIMINAZIONE RECORD', `Sei sicuro di voler cancellare definitivamente "${localItem.team_name || localItem.name}"? L'operazione non è reversibile.`, async () => {
                                await supabase.from(type === 'registration' ? 'registrations' : 'messages').delete().eq('id', item.id);
                                onRefresh(); onBack();
                            }, true)}
                            style={btnDeleteStyle}
                        >
                            🗑️ ELIMINA
                        </button>
                        {type === 'registration' && <button onClick={commitAllChanges} disabled={loading.saving} style={btnSaveStyle(loading.saving)}>{loading.saving ? 'SINCRO...' : '💾 SALVA TUTTO'}</button>}
                    </div>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#0d0d12' }}>
                    {(type === 'registration' ? regTabs : [{ id: 'm', label: 'MESSAGGIO' }]).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '50px', minHeight: '600px' }}>
                    {activeTab === 'm' ? (
                        <div style={sectionBox}>
                            <h3 style={sectionTitle}>CONTENUTO MESSAGGIO</h3>
                            <div style={{ color: '#fff', fontSize: '1.4rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{localItem.message}</div>
                        </div>
                    ) : activeTab === 'management' ? (
                        <div style={{ display: 'grid', gap: '40px' }}>
                            <div style={sectionBox}>
                                <h3 style={sectionTitle}>💰 STATO AMMINISTRATIVO</h3>
                                <div style={{ display: 'flex', gap: '30px' }}>
                                    <div style={{ flex: 1 }}><label style={megaLabel}>PAGATO</label><select value={localItem.is_paid || 'NO'} onChange={e => setLocalItem({ ...localItem, is_paid: e.target.value })} style={premiumSelect}><option value="NO">❌ NO</option><option value="SI">✅ SI</option></select></div>
                                    <div style={{ flex: 1 }}><label style={megaLabel}>DATA</label><input type="date" value={localItem.payment_date || ''} onChange={e => setLocalItem({ ...localItem, payment_date: e.target.value })} style={premiumInput} /></div>
                                </div>
                            </div>
                            <div style={sectionBox}>
                                <h3 style={sectionTitle}>🏁 DATI GARA</h3>
                                <div style={{ display: 'flex', gap: '30px' }}>
                                    <div style={{ flex: 1 }}><label style={megaLabel}>NUMERO</label><input value={localItem.bib_number || ''} onChange={e => setLocalItem({ ...localItem, bib_number: e.target.value })} style={premiumInput} /></div>
                                    <div style={{ flex: 1 }}><label style={megaLabel}>PARTENZA</label><input value={localItem.departure_time || ''} onChange={e => setLocalItem({ ...localItem, departure_time: e.target.value })} style={premiumInput} /></div>
                                </div>
                            </div>
                            <div style={sectionBoxPartner}>
                                <h3 style={sectionTitle}>🤝 PARTNER</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                    <div><label style={megaLabel}>NOME</label><input value={localItem.secondo_nome || ''} onChange={e => setLocalItem({ ...localItem, secondo_nome: e.target.value })} style={premiumInput} /></div>
                                    <div><label style={megaLabel}>COGNOME</label><input value={localItem.secondo_cognome || ''} onChange={e => setLocalItem({ ...localItem, secondo_cognome: e.target.value })} style={premiumInput} /></div>
                                    <div><label style={megaLabel}>CELLULARE</label><input value={localItem.secondo_cellulare || ''} onChange={e => setLocalItem({ ...localItem, secondo_cellulare: e.target.value })} style={premiumInput} /></div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gap: '40px' }}>
                            <div style={photoSection}>
                                <div style={photoDropBox}>{loading.photo ? <div className="spinner">⌛</div> : getPhotoDisplayUrl(localItem.pilot_photo) ? <img src={getPhotoDisplayUrl(localItem.pilot_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '3rem', opacity: 0.3 }}>📷</span>}<input type="file" onChange={handlePhotoUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} /></div>
                                <div><h4 style={{ color: '#FFCC00', margin: 0 }}>FOTO PROFILO</h4><p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Clicca per caricare.</p></div>
                            </div>
                            <label style={megaLabel}>BIOGRAFIA PILOTA</label>
                            <textarea value={localItem.pilot_bio || ''} onChange={e => setLocalItem({ ...localItem, pilot_bio: e.target.value })} style={ultraTextAreaStyle} placeholder="La tua storia..." />
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                            {regTabs.find(t => t.id === activeTab)?.fields.map(f => (
                                <div key={f} style={fieldContainerStyle}><label style={megaLabel}>{f.replace(/_/g, ' ').toUpperCase()}</label><input value={localItem[f] || ''} onChange={e => setLocalItem({ ...localItem, [f]: e.target.value })} style={premiumInput} /></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ backgroundColor: '#000', borderRadius: '40px', padding: '40px', border: '2px solid #E6007E', display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '900px', boxShadow: '0 20px 80px rgba(230,0,126,0.1)' }}>
                <h3 style={{ color: '#E6007E', fontWeight: 900, marginBottom: '30px', letterSpacing: '2px' }}>CRM LOG</h3>
                <button onClick={addNote} style={btnAddNoteStyle}>+ AGGIUNGI NOTA</button>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} style={darkInputArea} placeholder="Nuova nota..." />
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={noteItemBox}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#FFCC00', fontSize: '0.75rem', fontWeight: 'bold' }}>{new Date(n.created_at).toLocaleString('it-IT')}</span>
                                <span onClick={() => askConfirm('ELIMINAZIONE NOTA', 'Vuoi davvero cancellare questa nota?', async () => { await supabase.from(noteTable).delete().eq('id', n.id); fetchNotes(); }, true)} style={{ cursor: 'pointer', opacity: 0.5 }}>🗑️</span>
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.6' }}>{n.content}</div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinner { animation: rotate 1s linear infinite; font-size: 3rem; color: #FFCC00; }
                @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}

// PREMIUM STYLES
const toastStyle = (t) => ({ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: t === 'success' ? '#4CAF50' : '#E6007E', color: '#fff', padding: '15px 40px', borderRadius: '50px', fontWeight: 900, zIndex: 10000, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' });
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContent = { backgroundColor: '#111', padding: '40px', borderRadius: '32px', border: '1px solid #333', maxWidth: '500px', width: '90%', animation: 'modalFadeIn 0.2s ease-out' };
const btnModalCancel = { background: '#222', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnModalConfirm = { background: '#FFCC00', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' };
const btnModalDanger = { background: '#ff4444', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' };

const idBadge = { backgroundColor: '#111', color: '#666', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', border: '1px solid #333', fontWeight: 'bold' };
const btnSaveStyle = (l) => ({ backgroundColor: l ? '#333' : '#FFCC00', color: '#000', border: 'none', padding: '15px 35px', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: l ? 'wait' : 'pointer', boxShadow: '0 10px 20px rgba(255,204,0,0.2)' });
const btnDeleteStyle = { background: 'transparent', color: '#ff4444', border: '2px solid #ff4444', padding: '15px 35px', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', transition: '0.2s' };
const tabStyle = (a) => ({ flex: 1, padding: '25px', border: 'none', background: a ? '#1a1a1f' : 'transparent', color: a ? '#FFCC00' : '#666', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', borderBottom: a ? '4px solid #FFCC00' : 'none' });
const sectionBox = { backgroundColor: '#16161a', padding: '30px', borderRadius: '24px', border: '1px solid #222' };
const sectionBoxPartner = { backgroundColor: 'rgba(230,0,126,0.03)', padding: '30px', borderRadius: '24px', border: '1px dashed #E6007E' };
const sectionTitle = { color: '#fff', fontSize: '1.1rem', fontWeight: 900, margin: '0 0 25px 0', borderLeft: '4px solid #FFCC00', paddingLeft: '15px', textTransform: 'uppercase' };
const megaLabel = { color: '#FFCC00', fontSize: '0.75rem', fontWeight: 900, display: 'block', marginBottom: '10px', opacity: 0.8 };
const premiumInput = { width: '100%', background: '#09090b', border: '1px solid #333', color: '#fff', fontSize: '1.2rem', padding: '18px', borderRadius: '14px', outline: 'none' };
const premiumSelect = { width: '100%', background: '#09090b', border: '1px solid #333', color: '#fff', fontSize: '1.2rem', padding: '18px', borderRadius: '14px', outline: 'none', cursor: 'pointer' };
const fieldContainerStyle = { backgroundColor: '#16161a', padding: '20px', borderRadius: '16px', border: '1px solid #222' };
const ultraTextAreaStyle = { width: '100%', backgroundColor: '#09090b', border: '2px solid #222', color: '#fff', fontSize: '1.3rem', padding: '30px', borderRadius: '24px', minHeight: '350px', outline: 'none', lineHeight: '1.6' };
const photoSection = { display: 'flex', gap: '30px', alignItems: 'center', backgroundColor: '#16161a', padding: '25px', borderRadius: '24px', border: '1px solid #222' };
const photoDropBox = { width: '180px', height: '180px', backgroundColor: '#000', border: '3px dashed #FFCC00', borderRadius: '32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnAddNoteStyle = { width: '100%', background: '#FFCC00', color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', marginBottom: '15px', boxShadow: '0 10px 30px rgba(255,204,0,0.1)' };
const darkInputArea = { width: '100%', background: '#16161a', border: '1px solid #333', color: '#fff', padding: '20px', borderRadius: '20px', minHeight: '120px', outline: 'none', resize: 'none' };
const noteItemBox = { backgroundColor: '#111', padding: '25px', borderRadius: '24px', borderLeft: '6px solid #FFCC00', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' };
