/**
 * 🧬 COMPONENT: CRM Detail Panel v4.0 (Multi-Theme & Attachments)
 * Features: Cyan/Yellow Theme Switching, Custom Modals, Attachment Manager
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [activeTab, setActiveTab] = useState(type === 'registration' ? 'management' : 'm');

    // UI Theme Settings
    const isMsg = type === 'message';
    const primaryColor = isMsg ? '#00E5FF' : '#FFCC00'; // Cyan for Messages, Yellow for Registrations
    const accentColor = isMsg ? '#00C4CC' : '#E6007E'; // Darker Cyan vs Fuchsia
    const themeShadow = isMsg ? 'rgba(0,229,255,0.1)' : 'rgba(230,0,126,0.1)';

    // UI STATES
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
            setActiveTab(isMsg ? 'm' : 'management');
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
            const allowedFields = isMsg ? ['name', 'email', 'message', 'status'] : [
                'team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation',
                'nome', 'cognome', 'email', 'telefono', 'codice_fiscale', 'pilot_bio',
                'pilot_photo', 'is_paid', 'payment_date', 'bib_number', 'departure_time',
                'secondo_nome', 'secondo_cognome', 'secondo_cellulare'
            ];
            const updateData = {};
            allowedFields.forEach(f => { if (localItem[f] !== undefined) updateData[f] = localItem[f]; });
            const { error } = await supabase.from(table).update(updateData).eq('id', item.id);
            if (error) throw error;
            showToast('success', 'AGGIORNATO CON SUCCESSO');
            onRefresh();
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, saving: false })); }
    }

    async function handleFileAttach(e) {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(prev => ({ ...prev, attach: true }));
        try {
            const fileName = `${item.id}-${Date.now()}-${file.name}`;
            const filePath = `${isMsg ? 'messages' : 'registrations'}/${fileName}`;

            const { error: upErr } = await supabase.storage.from('attachments').upload(filePath, file);
            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);

            await supabase.from('crm_attachments').insert([{
                [foreignKey]: item.id,
                file_url: publicUrl,
                file_name: file.name,
                file_size: file.size
            }]);

            fetchAttachments();
            showToast('success', 'ALLEGATO CARICATO');
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, attach: false })); }
    }

    async function deleteAttachment(id) {
        const { error } = await supabase.from('crm_attachments').delete().eq('id', id);
        if (!error) { fetchAttachments(); showToast('success', 'ALLEGATO RIMOSSO'); }
    }

    const regTabs = [
        { id: 'management', label: 'GESTIONE EVENTO', fields: [] },
        { id: 'general', label: 'TEAM & MOTO', fields: ['team_name', 'moto_details'] },
        { id: 'personal', label: 'ANAGRAFICA', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale'] },
        { id: 'bio', label: 'BIO PILOTA', fields: ['pilot_photo', 'pilot_bio'] }
    ];

    return (
        <div style={{ maxWidth: '1450px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 450px', gap: '40px', position: 'relative' }}>

            {status.visible && <div style={toastStyle(status.type === 'success' ? '#4CAF50' : '#E6007E')}>{status.type === 'success' ? '✅ ' : '❌ '}{status.message}</div>}

            {modal.visible && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ color: modal.isDanger ? '#ff4444' : primaryColor }}>{modal.title}</h3>
                        <p style={{ color: '#fff', fontSize: '1.1rem', margin: '20px 0 30px 0' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal({ ...modal, visible: false })} style={btnModalCancel}>ANNULLA</button>
                            <button onClick={() => { modal.onConfirm(); setModal({ ...modal, visible: false }); }} style={modal.isDanger ? btnModalDanger : btnModalConfirm(primaryColor)}>CONFERMA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT COLUMN */}
            <div style={{ backgroundColor: '#111', borderRadius: '40px', border: `1px solid ${isMsg ? 'rgba(0,229,255,0.2)' : '#333'}`, overflow: 'hidden', boxShadow: `0 40px 100px ${themeShadow}` }}>
                <div style={{ padding: '40px 50px', backgroundColor: '#000', borderBottom: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', color: primaryColor, margin: 0, fontWeight: 900 }}>{localItem.team_name || localItem.name}</h2>
                        <div style={{ marginTop: '10px' }}><span style={idBadge}>{type.toUpperCase()}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={() => askConfirm('ELIMINAZIONE', 'Cancellare definitivamente?', async () => { await supabase.from(isMsg ? 'messages' : 'registrations').delete().eq('id', item.id); onRefresh(); onBack(); }, true)} style={btnDeleteStyle}>🗑️ ELIMINA</button>
                        {!isMsg && <button onClick={commitAllChanges} disabled={loading.saving} style={btnSaveStyle(loading.saving, primaryColor)}>{loading.saving ? 'SINCRO...' : '💾 SALVA TUTTO'}</button>}
                    </div>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#0d0d12' }}>
                    {(isMsg ? [{ id: 'm', label: 'MESSAGGIO' }] : regTabs).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id, primaryColor)}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '50px', minHeight: '600px' }}>
                    {activeTab === 'm' ? (
                        <div style={sectionBox}>
                            <h3 style={sectionTitle(primaryColor)}>CONTENUTO MESSAGGIO</h3>
                            <div style={{ color: '#fff', fontSize: '1.4rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{localItem.message}</div>
                        </div>
                    ) : activeTab === 'management' ? (
                        <div style={{ display: 'grid', gap: '40px' }}>
                            <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>💰 PAGAMENTO</h3><div style={{ display: 'flex', gap: '20px' }}><div style={{ flex: 1 }}><label style={megaLabel(primaryColor)}>STATO</label><select value={localItem.is_paid || 'NO'} onChange={e => setLocalItem({ ...localItem, is_paid: e.target.value })} style={premiumSelect}><option value="NO">❌ NO</option><option value="SI">✅ SI</option></select></div><div style={{ flex: 1 }}><label style={megaLabel(primaryColor)}>DATA</label><input type="date" value={localItem.payment_date || ''} onChange={e => setLocalItem({ ...localItem, payment_date: e.target.value })} style={premiumInput} /></div></div></div>
                            <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>🏁 GARA</h3><div style={{ display: 'flex', gap: '20px' }}><div style={{ flex: 1 }}><label style={megaLabel(primaryColor)}>NR. TABELLA</label><input value={localItem.bib_number || ''} onChange={e => setLocalItem({ ...localItem, bib_number: e.target.value })} style={premiumInput} /></div><div style={{ flex: 1 }}><label style={megaLabel(primaryColor)}>PARTENZA</label><input value={localItem.departure_time || ''} onChange={e => setLocalItem({ ...localItem, departure_time: e.target.value })} style={premiumInput} /></div></div></div>
                            <div style={sectionBoxPartner}><h3 style={sectionTitle(isMsg ? '#00E5FF' : '#E6007E')}>🤝 PARTNER</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}><div><label style={megaLabel(primaryColor)}>NOME</label><input value={localItem.secondo_nome || ''} onChange={e => setLocalItem({ ...localItem, secondo_nome: e.target.value })} style={premiumInput} /></div><div><label style={megaLabel(primaryColor)}>COGNOME</label><input value={localItem.secondo_cognome || ''} onChange={e => setLocalItem({ ...localItem, secondo_cognome: e.target.value })} style={premiumInput} /></div><div><label style={megaLabel(primaryColor)}>CELLULARE</label><input value={localItem.secondo_cellulare || ''} onChange={e => setLocalItem({ ...localItem, secondo_cellulare: e.target.value })} style={premiumInput} /></div></div></div>
                        </div>
                    ) : activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gap: '40px' }}>
                            <div style={photoSection}><div style={photoDropBox(primaryColor)}>{loading.photo ? '⌛' : localItem.pilot_photo ? <img src={localItem.pilot_photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}<input type="file" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} /></div><div><h4 style={{ color: primaryColor, margin: 0 }}>FOTO</h4><p style={{ color: '#888', margin: 0 }}>Carica profilo.</p></div></div>
                            <textarea value={localItem.pilot_bio || ''} onChange={e => setLocalItem({ ...localItem, pilot_bio: e.target.value })} style={ultraTextAreaStyle} placeholder="Bio..." />
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                            {regTabs.find(t => t.id === activeTab)?.fields.map(f => (
                                <div key={f} style={fieldContainerStyle}><label style={megaLabel(primaryColor)}>{f.toUpperCase()}</label><input value={localItem[f] || ''} onChange={e => setLocalItem({ ...localItem, [f]: e.target.value })} style={premiumInput} /></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: CRM LOG & ATTACHMENTS */}
            <div style={{ backgroundColor: '#000', borderRadius: '40px', padding: '40px', border: `2px solid ${accentColor}`, display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '900px' }}>
                <h3 style={{ color: accentColor, fontWeight: 900, marginBottom: '30px', letterSpacing: '2px' }}>CRM & ALLEGATI</h3>

                {/* Allegati Manager */}
                <div style={{ marginBottom: '40px', backgroundColor: '#111', padding: '20px', borderRadius: '24px', border: '1px solid #222' }}>
                    <h4 style={{ color: primaryColor, fontSize: '0.8rem', fontWeight: 900, marginBottom: '15px' }}>📂 FILE ALLEGATI</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                        {attachments.map(a => (
                            <div key={a.id} style={attachPill}>
                                <a href={a.file_url} target="_blank" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.file_name}</a>
                                <span onClick={() => deleteAttachment(a.id)} style={{ marginLeft: '10px', cursor: 'pointer', opacity: 0.5 }}>✕</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button style={btnAttachStyle(primaryColor)}>{loading.attach ? 'CARICAMENTO...' : '+ AGGIUNGI FILE'}</button>
                        <input type="file" onChange={handleFileAttach} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <button onClick={addNote} style={btnAddNoteStyle(primaryColor)}>+ AGGIUNGI NOTA</button>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} style={darkInputArea} placeholder="Scrivi una nota..." />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={noteItemBox(primaryColor)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: primaryColor, fontSize: '0.75rem', fontWeight: 'bold' }}>{new Date(n.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem' }}>{n.content}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// PREMIUM STYLES
const toastStyle = (c) => ({ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: c, color: '#fff', padding: '15px 40px', borderRadius: '50px', fontWeight: 900, zIndex: 10000 });
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContent = { backgroundColor: '#111', padding: '40px', borderRadius: '32px', border: '1px solid #333', maxWidth: '500px', width: '90%' };
const btnModalCancel = { background: '#222', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer' };
const btnModalConfirm = (c) => ({ background: c, color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' });
const btnModalDanger = { background: '#ff4444', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' };
const idBadge = { backgroundColor: '#111', color: '#666', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem' };
const btnSaveStyle = (l, c) => ({ backgroundColor: l ? '#333' : c, color: '#000', border: 'none', padding: '15px 35px', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' });
const btnDeleteStyle = { background: 'transparent', color: '#ff4444', border: '2px solid #ff4444', padding: '15px 35px', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' };
const tabStyle = (a, c) => ({ flex: 1, padding: '25px', border: 'none', background: a ? '#1a1a1f' : 'transparent', color: a ? c : '#666', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', borderBottom: a ? `4px solid ${c}` : 'none' });
const sectionBox = { backgroundColor: '#16161a', padding: '30px', borderRadius: '24px', border: '1px solid #222' };
const sectionBoxPartner = { backgroundColor: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '24px', border: '1px dashed #444' };
const sectionTitle = (c) => ({ color: '#fff', fontSize: '1.1rem', fontWeight: 900, margin: '0 0 25px 0', borderLeft: `4px solid ${c}`, paddingLeft: '15px', textTransform: 'uppercase' });
const megaLabel = (c) => ({ color: c, fontSize: '0.75rem', fontWeight: 900, display: 'block', marginBottom: '10px' });
const premiumInput = { width: '100%', background: '#09090b', border: '1px solid #333', color: '#fff', fontSize: '1.2rem', padding: '18px', borderRadius: '14px' };
const premiumSelect = { width: '100%', background: '#09090b', border: '1px solid #333', color: '#fff', fontSize: '1.2rem', padding: '18px', borderRadius: '14px' };
const fieldContainerStyle = { backgroundColor: '#16161a', padding: '20px', borderRadius: '16px', border: '1px solid #222' };
const ultraTextAreaStyle = { width: '100%', backgroundColor: '#09090b', border: '2px solid #222', color: '#fff', fontSize: '1.3rem', padding: '30px', borderRadius: '24px', minHeight: '350px' };
const photoSection = { display: 'flex', gap: '30px', alignItems: 'center', backgroundColor: '#16161a', padding: '25px', borderRadius: '24px' };
const photoDropBox = (c) => ({ width: '180px', height: '180px', backgroundColor: '#000', border: `3px dashed ${c}`, borderRadius: '32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const btnAddNoteStyle = (c) => ({ width: '100%', background: c, color: '#000', border: 'none', padding: '20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', marginBottom: '15px' });
const btnAttachStyle = (c) => ({ width: '100%', background: '#222', color: c, border: `1px dashed ${c}`, padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' });
const darkInputArea = { width: '100%', background: '#16161a', border: '1px solid #333', color: '#fff', padding: '20px', borderRadius: '20px', minHeight: '120px' };
const noteItemBox = (c) => ({ backgroundColor: '#111', padding: '25px', borderRadius: '24px', borderLeft: `6px solid ${c}` });
const attachPill = { backgroundColor: '#222', padding: '8px 15px', borderRadius: '50px', display: 'flex', alignItems: 'center', border: '1px solid #333' };
