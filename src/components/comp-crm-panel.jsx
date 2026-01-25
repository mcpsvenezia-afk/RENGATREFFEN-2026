/**
 * 🧬 COMPONENT: CRM Detail Panel v5.0 (Final Premium Layout)
 * Goal: Reordered Sidebar (Button-Input-Log-Attach), Editable Tabs, Note Management
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const [activeTab, setActiveTab] = useState(type === 'registration' ? 'management' : 'm');

    // UI Theme Settings
    const isMsg = type === 'message';
    const primaryColor = isMsg ? '#00E5FF' : '#FFCC00';
    const accentColor = isMsg ? '#008ba3' : '#E6007E';
    const themeShadow = isMsg ? 'rgba(0,229,255,0.1)' : 'rgba(230,0,126,0.1)';

    const [status, setStatus] = useState({ type: '', message: '', visible: false });
    const [loading, setLoading] = useState({ saving: false, deleting: false, photo: false, attach: false });
    const [modal, setModal] = useState({ visible: false, title: '', message: '', onConfirm: null, isDanger: false });

    const noteTable = isMsg ? 'message_notes' : 'registration_notes';
    const foreignKey = isMsg ? 'message_id' : 'registration_id';

    useEffect(() => {
        if (item) {
            setLocalItem(item);
            fetchNotes();
            fetchAttachments();
        }
    }, [item, type]);

    const showToast = (t, m) => {
        setStatus({ type: t, message: m, visible: true });
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

    async function fetchAttachments() {
        if (!item?.id) return;
        const { data, error } = await supabase.from('crm_attachments').select('*').eq(foreignKey, item.id).order('created_at', { ascending: false });
        if (!error) setAttachments(data);
    }

    async function commitAllChanges() {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const table = isMsg ? 'messages' : 'registrations';
            const { error } = await supabase.from(table).update(localItem).eq('id', item.id);
            if (error) throw error;
            showToast('success', 'DATI SALVATI');
            onRefresh();
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, saving: false })); }
    }

    async function addNote() {
        if (!newNote.trim()) return;
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            if (editingNote) {
                await supabase.from(noteTable).update({ content: newNote }).eq('id', editingNote.id);
                setEditingNote(null);
            } else {
                await supabase.from(noteTable).insert([{ [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }]);
            }
            setNewNote('');
            fetchNotes();
            showToast('success', 'NOTA AGGIORNATA');
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, saving: false })); }
    }

    async function deleteNote(id) {
        askConfirm('ELIMINA NOTA', 'Sei sicuro di voler eliminare questa nota?', async () => {
            const { error } = await supabase.from(noteTable).delete().eq('id', id);
            if (!error) { fetchNotes(); showToast('success', 'NOTA ELIMINATA'); }
        }, true);
    }

    async function handleFileAttach(e) {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(prev => ({ ...prev, attach: true }));
        try {
            const fileName = `${item.id}-${Date.now()}-${file.name}`;
            const filePath = `${isMsg ? 'messages' : 'registrations'}/${fileName}`;
            await supabase.storage.from('attachments').upload(filePath, file);
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
            await supabase.from('crm_attachments').insert([{ [foreignKey]: item.id, file_url: publicUrl, file_name: file.name, file_size: file.size }]);
            fetchAttachments();
            showToast('success', 'ALLEGATO OK');
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, attach: false })); }
    }

    const regTabs = [
        { id: 'management', label: 'GESTIONE EVENTO' },
        { id: 'team', label: 'TEAM & MOTO' },
        { id: 'personal', label: 'ANAGRAFICA' },
        { id: 'partner', label: 'PARTNER' },
        { id: 'bio', label: 'BIO PILOTA' },
        { id: 'requirements', label: 'REQUISITI' },
        { id: 'health', label: 'SALUTE & EXTRA' }
    ];

    return (
        <div style={{ maxWidth: '1450px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 450px', gap: '40px', position: 'relative' }}>

            {status.visible && <div style={toastStyle(status.type === 'success' ? '#4CAF50' : '#E6007E')}>{status.type === 'success' ? '✅ ' : '❌ '}{status.message}</div>}

            {modal.visible && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ color: modal.isDanger ? '#ff4444' : primaryColor }}>{modal.title}</h3>
                        <p style={{ color: '#fff' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                            <button onClick={() => setModal({ ...modal, visible: false })} style={btnModalCancel}>ANNULLA</button>
                            <button onClick={() => { modal.onConfirm(); setModal({ ...modal, visible: false }); }} style={modal.isDanger ? btnModalDanger : btnModalConfirm(primaryColor)}>CONFERMA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT PANEL: DATA */}
            <div style={{ backgroundColor: '#09090b', borderRadius: '40px', border: `1px solid ${isMsg ? 'rgba(0,229,255,0.2)' : '#333'}`, overflow: 'hidden' }}>
                <div style={{ padding: '50px', backgroundColor: '#000', borderBottom: '2px solid #333' }}>
                    <h2 style={{ fontSize: '3rem', color: primaryColor, margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>{localItem.team_name || localItem.name}</h2>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <span style={idBadgeStyle(accentColor)}>ID: {item.id}</span>
                        <div style={{ flex: 1 }}></div>
                        <button onClick={() => askConfirm('ELIMINA!', 'Cancellare definitivamente?', async () => { await supabase.from(isMsg ? 'messages' : 'registrations').delete().eq('id', item.id); onRefresh(); onBack(); }, true)} style={btnDeleteStyle}>🗑️ ELIMINA</button>
                        <button onClick={commitAllChanges} disabled={loading.saving} style={btnSaveStyle(primaryColor)}>{loading.saving ? 'SALVATAGGIO...' : '💾 SALVA TUTTO'}</button>
                    </div>
                </div>

                <div style={{ display: 'flex', overflowX: 'auto', backgroundColor: '#111', borderBottom: '1px solid #333' }}>
                    {(isMsg ? [{ id: 'm', label: 'MESSAGGIO' }] : regTabs).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id, primaryColor)}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '50px', minHeight: '600px' }}>
                    {activeTab === 'm' ? (
                        <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>CONTENUTO MESSAGGIO</h3><textarea value={localItem.message || ''} onChange={e => setLocalItem({ ...localItem, message: e.target.value })} style={ultraTextAreaStyle} /></div>
                    ) : activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gap: '40px' }}>
                            <div style={photoSection}><div style={photoDropBox(primaryColor)}>{localItem.pilot_photo ? <img src={localItem.pilot_photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}<input type="file" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} /></div><div><h4 style={{ color: primaryColor, margin: 0 }}>FOTO PROFILO</h4><p style={{ color: '#888', margin: 0, fontSize: '0.8rem' }}>Clicca per cambiare.</p></div></div>
                            <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>BIOGRAFIA PILOTA</h3><textarea value={localItem.pilot_bio || ''} onChange={e => setLocalItem({ ...localItem, pilot_bio: e.target.value })} style={ultraTextAreaStyle} /></div>
                        </div>
                    ) : activeTab === 'management' ? (
                        <div style={{ display: 'grid', gap: '30px' }}>
                            <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>AMMINISTRAZIONE</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}><div><label style={megaLabel(primaryColor)}>PAGATO</label><select value={localItem.is_paid || 'NO'} onChange={e => setLocalItem({ ...localItem, is_paid: e.target.value })} style={premiumSelect}><option value="NO">NO</option><option value="SI">SI</option></select></div><div><label style={megaLabel(primaryColor)}>DATA</label><input type="date" value={localItem.payment_date || ''} onChange={e => setLocalItem({ ...localItem, payment_date: e.target.value })} style={premiumInput} /></div></div></div>
                            <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>GARA</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}><div><label style={megaLabel(primaryColor)}>NUMERO</label><input value={localItem.bib_number || ''} onChange={e => setLocalItem({ ...localItem, bib_number: e.target.value })} style={premiumInput} /></div><div><label style={megaLabel(primaryColor)}>PARTENZA</label><input value={localItem.departure_time || ''} onChange={e => setLocalItem({ ...localItem, departure_time: e.target.value })} style={premiumInput} /></div></div></div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                            {Object.keys(localItem).filter(k => !['id', 'created_at', 'pilot_photo', 'pilot_bio', 'message', 'is_paid', 'payment_date', 'bib_number', 'departure_time'].includes(k)).map(k => (
                                <div key={k} style={fieldContainerStyle}><label style={megaLabel(primaryColor)}>{k.toUpperCase().replace(/_/g, ' ')}</label><input value={localItem[k] || ''} onChange={e => setLocalItem({ ...localItem, [k]: e.target.value })} style={premiumInput} /></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: REORDERED CRM SIDEBAR (Button -> Input -> Log -> Attach) */}
            <div style={{ backgroundColor: '#09090b', borderRadius: '40px', padding: '40px', border: `2px solid ${accentColor}`, display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '900px' }}>
                <h3 style={{ color: accentColor, fontWeight: 900, marginBottom: '20px', textTransform: 'uppercase' }}>CRM Activity Log</h3>

                {/* 1. PULSANTE AGGIUNGI NOTA */}
                <button onClick={addNote} style={btnAddNoteStyle(primaryColor)}>
                    {editingNote ? '💾 SALVA MODIFICA' : '+ AGGIUNGI NOTA'}
                </button>

                {/* 2. CAMPO TESTO NOTA */}
                <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                    <textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        style={darkInputArea}
                        placeholder="Scrivi qui la tua nota..."
                    />
                    {editingNote && <button onClick={() => { setEditingNote(null); setNewNote(''); }} style={{ background: 'none', color: '#888', border: 'none', marginTop: '10px', cursor: 'pointer' }}>X Annulla Modifica</button>}
                </div>

                <div style={{ height: '1px', background: '#222', marginBottom: '30px' }}></div>

                {/* 3. AREA PER LE NOTE (LOG) */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={noteItemBox(primaryColor)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: primaryColor, fontSize: '0.75rem', fontWeight: 900 }}>{new Date(n.created_at).toLocaleString()}</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <span onClick={() => { setEditingNote(n); setNewNote(n.content); }} style={{ cursor: 'pointer', opacity: 0.6 }}>✏️</span>
                                    <span onClick={() => deleteNote(n.id)} style={{ cursor: 'pointer', opacity: 0.6 }}>🗑️</span>
                                </div>
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.5' }}>{n.content}</div>
                        </div>
                    ))}
                    {notes.length === 0 && <div style={{ textAlign: 'center', color: '#444' }}>Nessuna attività registrata.</div>}
                </div>

                {/* 4. CARICA ALLEGATO (ALLA FINE) */}
                <div style={{ position: 'relative', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                        {attachments.map(a => (
                            <div key={a.id} style={attachPill}>
                                <a href={a.file_url} target="_blank" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.75rem' }}>{a.file_name}</a>
                            </div>
                        ))}
                    </div>
                    <button style={btnAttachFullStyle}>📂 CARICA ALLEGATO</button>
                    <input type="file" onChange={handleFileAttach} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
            </div>
        </div>
    );
}

// STYLES
const toastStyle = (c) => ({ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: c, color: '#fff', padding: '15px 40px', borderRadius: '50px', fontWeight: 900, zIndex: 10000 });
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContent = { backgroundColor: '#111', padding: '40px', borderRadius: '32px', border: '1px solid #333', maxWidth: '500px', width: '90%' };
const btnModalCancel = { background: '#222', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px' };
const btnModalConfirm = (c) => ({ background: c, color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 900 });
const btnModalDanger = { background: '#ff4444', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 900 };
const idBadgeStyle = (c) => ({ color: c, fontSize: '0.7rem', fontWeight: 900, border: `1px solid ${c}33`, padding: '5px 15px', borderRadius: '50px' });
const btnSaveStyle = (c) => ({ backgroundColor: c, color: '#000', border: 'none', padding: '15px 35px', borderRadius: '15px', fontWeight: 900 });
const btnDeleteStyle = { background: 'none', color: '#ff4444', border: '1px solid #ff4444', padding: '15px 35px', borderRadius: '15px', fontWeight: 900, marginRight: '10px' };
const tabStyle = (a, c) => ({ padding: '25px 35px', border: 'none', background: a ? '#000' : 'transparent', color: a ? c : '#666', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', borderBottom: a ? `4px solid ${c}` : 'none', whiteSpace: 'nowrap' });
const sectionBox = { backgroundColor: '#111', padding: '35px', borderRadius: '24px', border: '1px solid #222' };
const sectionTitle = (c) => ({ color: '#fff', fontSize: '1.1rem', fontWeight: 900, borderLeft: `5px solid ${c}`, paddingLeft: '15px', marginBottom: '25px' });
const megaLabel = (c) => ({ color: c, fontSize: '0.7rem', fontWeight: 900, marginBottom: '8px', display: 'block' });
const premiumInput = { width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '18px', borderRadius: '12px' };
const premiumSelect = { width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '18px', borderRadius: '12px' };
const ultraTextAreaStyle = { width: '100%', background: '#09090b', border: '1px solid #222', color: '#fff', padding: '30px', borderRadius: '24px', minHeight: '300px', fontSize: '1.2rem', lineHeight: '1.6' };
const fieldContainerStyle = { background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #222' };
const photoSection = { display: 'flex', gap: '30px', alignItems: 'center', background: '#111', padding: '30px', borderRadius: '24px' };
const photoDropBox = (c) => ({ width: '160px', height: '160px', border: `2px dashed ${c}`, borderRadius: '24px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const btnAddNoteStyle = (c) => ({ width: '100%', background: c, color: '#000', border: 'none', padding: '20px', borderRadius: '100px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' });
const darkInputArea = { width: '100%', background: '#ccc', border: 'none', color: '#111', padding: '25px', borderRadius: '25px', minHeight: '180px', fontSize: '1.1rem', resize: 'none' };
const noteItemBox = (c) => ({ backgroundColor: '#111', padding: '25px', borderRadius: '24px', borderLeft: `6px solid ${c}` });
const attachPill = { background: '#222', padding: '8px 15px', borderRadius: '10px', fontSize: '0.75rem' };
const btnAttachFullStyle = { width: '100%', background: 'none', color: '#FFCC00', border: '1px solid #FFCC00', padding: '18px', borderRadius: '100px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' };
