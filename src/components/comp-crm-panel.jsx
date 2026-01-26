/**
 * 🧬 COMPONENT: CRM Detail Panel v5.5 (Final Request Polish)
 * Features:
 * 1. Sidebar Order: Add Button -> Textarea -> Logs -> Attach Button
 * 2. Full Delete/Edit for Notes
 * 3. Logical Tab Groups (No Duplicates)
 * 4. Reactive DB Sync
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { sendWelcomeEmail } from '../core/logic-email-v1.js';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [localItem, setLocalItem] = useState(item);
    const [notes, setNotes] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [activeTab, setActiveTab] = useState(type === 'registration' ? 'management' : 'm');

    // UI Theme Settings
    const isMsg = type === 'message';
    const primaryColor = isMsg ? '#00E5FF' : '#FFCC00';
    const accentColor = isMsg ? '#008ba3' : '#E6007E';
    const themeShadow = isMsg ? 'rgba(0,229,255,0.1)' : 'rgba(230,0,126,0.1)';

    const [status, setStatus] = useState({ type: '', message: '', visible: false });
    const [loading, setLoading] = useState({ saving: false, attach: false });
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
        setTimeout(() => setStatus(prev => ({ ...prev, visible: false })), 3000);
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
            showToast('success', 'SINCRONIZZATO');
            onRefresh();
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, saving: false })); }
    }

    async function handleSendConfirmationEmail() {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const res = await sendWelcomeEmail(localItem);
            if (res.success) {
                showToast('success', 'EMAIL INVIATA');
                // Aggiungiamo una nota automatica nel CRM
                await supabase.from(noteTable).insert([{
                    [foreignKey]: item.id,
                    content: '🤖 AUTO: Inviata email di conferma iscrizione via Resend.',
                    admin_name: 'System'
                }]);
                fetchNotes();
            } else {
                throw new Error(res.error?.message || 'Errore invio email');
            }
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    }

    async function submitNote() {
        if (!newNote.trim()) return;
        try {
            if (editingNoteId) {
                await supabase.from(noteTable).update({ content: newNote }).eq('id', editingNoteId);
                setEditingNoteId(null);
            } else {
                await supabase.from(noteTable).insert([{ [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }]);
            }
            setNewNote('');
            fetchNotes();
            showToast('success', 'CRM AGGIORNATO');
        } catch (err) { showToast('error', err.message); }
    }

    function startEditNote(n) {
        setEditingNoteId(n.id);
        setNewNote(n.content);
        // Scroll slightly if needed? No, just focus
        document.getElementById('note-input-area')?.focus();
    }

    async function deleteNote(id) {
        setModal({
            visible: true,
            title: 'ELIMINA NOTA',
            message: 'Questa azione è irreversibile. Procedere?',
            isDanger: true,
            onConfirm: async () => {
                const { error } = await supabase.from(noteTable).delete().eq('id', id);
                if (!error) { fetchNotes(); showToast('success', 'NOTA RIMOSTRA'); }
                setModal({ ...modal, visible: false });
            }
        });
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
            await supabase.from('crm_attachments').insert([{ [foreignKey]: item.id, file_url: publicUrl, file_name: file.name }]);
            fetchAttachments();
            showToast('success', 'FILE SALVATO');
        } catch (err) { showToast('error', err.message); } finally { setLoading(prev => ({ ...prev, attach: false })); }
    }

    const labelTranslations = {
        is_paid: 'STATO PAGAMENTO',
        payment_date: 'DATA PAGAMENTO',
        bib_number: 'NUMERO GARA (TABELLA)',
        departure_time: 'ORARIO PARTENZA',
        team_name: 'NOME DEL TEAM',
        moto_details: 'MOTO (MODELLO E TARGA)',
        team_role: 'RUOLO NEL TEAM',
        is_mcps_member: 'ISCRITTO MCPS',
        mcps_delegation: 'DELEGAZIONE MCPS',
        nome: 'NOME PILOTA',
        cognome: 'COGNOME PILOTA',
        codice_fiscale: 'CODICE FISCALE',
        citta_nascita: 'CITTÀ DI NASCITA',
        citta_residenza: 'CITTÀ DI RESIDENZA',
        via_residenza: 'VIA DI RESIDENZA',
        civico_residenza: 'CIVICO',
        cap_residenza: 'CAP',
        telefono: 'CELLULARE PILOTA',
        email: 'EMAIL DI CONTATTO',
        secondo_nome: 'NOME PARTNER',
        secondo_cognome: 'COGNOME PARTNER',
        secondo_cellulare: 'CELLULARE PARTNER',
        pilot_photo: 'FOTO PROFILO',
        pilot_bio: 'BIOGRAFIA / BIO',
        authorize_media: 'AUTORIZZA FOTO/VIDEO',
        authorize_pilot_profile: 'AUTORIZZA PROFILO SITO',
        has_roadbook_skill: 'USA ROADBOOK DIGITALE',
        understand_treasure_hunt: 'CONSAPEVOLEZZA CACCIA TESORO',
        understand_knobby_tires: 'OBBLIGO GOMME TASSELLATE',
        understand_team_of_2: 'TEAM COMPOSTO DA 2 PILOTI',
        understand_donation_no_refund: 'DONAZIONE NON RIMBORSABILE',
        understand_rain_or_shine: 'EVENTO CON OGNI METEO',
        accept_regulation: 'ACCETTA REGOLAMENTO',
        is_fango_tours_member: 'GIÀ SOCIO FANGO TOURS',
        request_fango_tours_membership: 'RICHIESTA TESSERA FANGO',
        accept_fango_insurance: 'ACCETTA ASSICURAZIONE',
        food_preferences: 'ALLERGIE / PREFERENZE',
        emergency_contact_phone: 'TEL. EMERGENZA SOS',
        emergency_contact_info: 'NOME CONTATTO EMERGENZA'
    };

    const regTabs = [
        { id: 'management', label: 'GESTIONE', fields: ['is_paid', 'payment_date', 'bib_number', 'departure_time'] },
        { id: 'team', label: 'TEAM & MOTO', fields: ['team_name', 'moto_details', 'team_role', 'is_mcps_member', 'mcps_delegation'] },
        { id: 'personal', label: 'ANAGRAFICA', fields: ['nome', 'cognome', 'codice_fiscale', 'citta_nascita', 'citta_residenza', 'via_residenza', 'civico_residenza', 'cap_residenza', 'telefono', 'email'] },
        { id: 'partner', label: 'PARTNER', fields: ['secondo_nome', 'secondo_cognome', 'secondo_cellulare'] },
        { id: 'bio', label: 'BIO PILOTA', fields: ['pilot_photo', 'pilot_bio', 'authorize_media', 'authorize_pilot_profile'] },
        { id: 'requirements', label: 'REQUISITI', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine', 'accept_regulation'] },
        { id: 'fango', label: 'SALUTE & FANGO', fields: ['is_fango_tours_member', 'request_fango_tours_membership', 'accept_fango_insurance', 'food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] },
        { id: 'comms', label: 'COMUNICAZIONI', fields: [] }
    ];

    return (
        <div data-component="CRMDetail" style={{ maxWidth: '1450px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 450px', gap: '30px', position: 'relative' }}>

            {status.visible && <div style={toastStyle(status.type === 'success' ? '#4CAF50' : '#E6007E')}>{status.message}</div>}

            {modal.visible && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ color: modal.isDanger ? '#ff4444' : primaryColor, margin: 0 }}>{modal.title}</h3>
                        <p style={{ color: '#fff', fontSize: '1.1rem', margin: '30px 0' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal({ ...modal, visible: false })} style={btnModalCancel}>ANNULLA</button>
                            <button onClick={() => modal.onConfirm()} style={modal.isDanger ? btnModalDanger : btnModalConfirm(primaryColor)}>CONFERMA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT: MASTER DATA */}
            <div style={{ backgroundColor: '#09090b', borderRadius: '40px', border: '1px solid #222', overflow: 'hidden', boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '50px', backgroundColor: '#000', borderBottom: '2px solid #333' }}>
                    <h2 style={{ fontSize: '3.2rem', color: primaryColor, margin: 0, fontWeight: 900 }}>{localItem.team_name || localItem.name || localItem.nome}</h2>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'baseline' }}>
                        <span style={idBadgeStyle(accentColor)}>ID ISCRIZIONE: {item.id}</span>
                        <div style={{ flex: 1 }}></div>
                        <button onClick={onBack} style={btnBackStyle}>CHIUDI</button>
                        <button onClick={commitAllChanges} disabled={loading.saving} style={btnSaveStyle(primaryColor)}>{loading.saving ? 'SINCRO...' : '💾 SALVA TUTTO'}</button>
                    </div>
                </div>

                <div style={{ display: 'flex', overflowX: 'auto', backgroundColor: '#111', borderBottom: '1px solid #222' }}>
                    {(isMsg ? [{ id: 'm', label: 'MESSAGGIO' }] : regTabs).map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id, primaryColor)}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '50px', minHeight: '650px', background: 'linear-gradient(to bottom, #09090b, #000)' }}>
                    {activeTab === 'm' ? (
                        <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>MESSAGGIO RICEVUTO</h3><textarea value={localItem.message || ''} onChange={e => setLocalItem({ ...localItem, message: e.target.value })} style={ultraTextAreaStyle} /></div>
                    ) : activeTab === 'bio' ? (
                        <div style={{ display: 'grid', gap: '40px' }}>
                            <div style={photoSection}><div style={photoDropBox(primaryColor)}>{localItem.pilot_photo ? <img src={localItem.pilot_photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}<input type="file" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} /></div><div><h4 style={{ color: primaryColor, margin: 0, fontWeight: 900 }}>LOGO / FOTO</h4><p style={{ color: '#666', fontSize: '0.8rem' }}>Asset memorizzato nel profilo.</p></div></div>
                            <div style={sectionBox}><h3 style={sectionTitle(primaryColor)}>BIOGRAFIA / CV</h3><textarea value={localItem.pilot_bio || ''} onChange={e => setLocalItem({ ...localItem, pilot_bio: e.target.value })} style={ultraTextAreaStyle} /></div>
                        </div>
                    ) : activeTab === 'comms' ? (
                        <div style={sectionBox}>
                            <h3 style={sectionTitle(primaryColor)}>CENTRO COMUNICAZIONI</h3>
                            <p style={{ color: '#888', marginBottom: '30px' }}>Invia comunicazioni ufficiali al pilota tramite Resend.</p>

                            <div style={{ display: 'grid', gap: '20px', maxWidth: '400px' }}>
                                <button
                                    onClick={handleSendConfirmationEmail}
                                    disabled={loading.saving}
                                    style={btnActionStyle(primaryColor)}
                                >
                                    {loading.saving ? 'INVIO IN CORSO...' : '✉️ INVIA EMAIL DI CONFERMA ISCRIZIONE'}
                                </button>

                                <div style={{ padding: '20px', backgroundColor: '#000', borderRadius: '15px', border: '1px solid #333' }}>
                                    <span style={{ color: '#555', fontSize: '0.8rem', fontWeight: 700 }}>STATO: PRONTO</span>
                                    <p style={{ color: '#444', fontSize: '0.75rem', margin: '5px 0 0 0' }}>L'email invierà il template di benvenuto a: <strong>{localItem.email}</strong></p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                            {regTabs.find(t => t.id === activeTab)?.fields.map(k => (
                                <div key={k} style={fieldContainerStyle}>
                                    <label style={megaLabel(primaryColor)}>{labelTranslations[k] || k.toUpperCase().replace(/_/g, ' ')}</label>
                                    {['is_paid', 'is_mcps_member', 'team_role', 'authorize_media', 'authorize_pilot_profile', 'has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine', 'accept_regulation', 'is_fango_tours_member', 'request_fango_tours_membership', 'accept_fango_insurance'].includes(k) ? (
                                        <select value={localItem[k] || ''} onChange={e => setLocalItem({ ...localItem, [k]: e.target.value })} style={premiumSelect}><option value="">--</option><option value="SI">SI</option><option value="NO">NO</option>{k === 'team_role' && <><option value="Capitano">Capitano</option><option value="partner">partner</option></>}</select>
                                    ) : (
                                        <input type={k.includes('date') ? 'date' : 'text'} value={localItem[k] || ''} onChange={e => setLocalItem({ ...localItem, [k]: e.target.value })} style={premiumInput} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: REORDERED CRM SIDEBAR */}
            <div style={{ backgroundColor: '#09090b', borderRadius: '40px', padding: '40px', border: `2px solid ${accentColor}`, display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '900px', boxShadow: `0 0 50px ${accentColor}11` }}>
                <h3 style={{ color: accentColor, fontWeight: 900, marginBottom: '25px', letterSpacing: '2px', textTransform: 'uppercase' }}>REGISTRO ATTIVITÀ CRM</h3>

                {/* 1. PULSANTE AGGIUNGI NOTA (AL TOP) */}
                <button onClick={submitNote} style={btnAddNoteStyle(primaryColor)}>
                    {editingNoteId ? '💾 AGGIORNA NOTA' : '+ AGGIUNGI NOTA'}
                </button>

                {/* 2. CAMPO PER SCRIVERE NOTA */}
                <div style={{ margin: '20px 0 30px 0' }}>
                    <textarea
                        id="note-input-area"
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        style={darkInputArea}
                        placeholder="Annota progressi, telefonate o stati..."
                    />
                    {editingNoteId && <div onClick={() => { setEditingNoteId(null); setNewNote(''); }} style={{ textAlign: 'right', color: primaryColor, fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px' }}>ANNULLA MODIFICA</div>}
                </div>

                <div style={{ height: '1px', background: '#333', marginBottom: '30px' }}></div>

                {/* 3. AREA PER LE NOTE (LOG) */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={noteItemBox(primaryColor)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: primaryColor, fontSize: '0.75rem', fontWeight: 900 }}>{new Date(n.created_at).toLocaleString()}</span>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.9rem' }}>
                                    <span onClick={() => startEditNote(n)} style={{ cursor: 'pointer', filter: 'grayscale(1) brightness(2)' }}>✏️</span>
                                    <span onClick={() => deleteNote(n.id)} style={{ cursor: 'pointer', filter: 'grayscale(1) brightness(1.5)' }}>🗑️</span>
                                </div>
                            </div>
                            <div style={{ color: '#eee', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: 500 }}>{n.content}</div>
                        </div>
                    ))}
                    {notes.length === 0 && <div style={{ textAlign: 'center', color: '#444', marginTop: '20px' }}>Nessun log CRM presente.</div>}
                </div>

                {/* 4. ALLEGATI (A FONDO) */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #222' }}>
                    <h4 style={{ color: '#888', fontSize: '0.75rem', fontWeight: 900, marginBottom: '15px', letterSpacing: '1px' }}>📎 ALLEGATI ({attachments.length})</h4>

                    {attachments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {attachments.map(a => {
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(a.file_name);
                                const isPdf = /\.pdf$/i.test(a.file_name);
                                const icon = isImage ? '🖼️' : isPdf ? '📄' : '📎';
                                return (
                                    <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 15px',
                                        background: '#111',
                                        border: '1px solid #333',
                                        borderRadius: '12px',
                                        textDecoration: 'none',
                                        transition: '0.2s'
                                    }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.background = '#1a1a1a'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#111'; }}
                                    >
                                        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.file_name}</div>
                                            <div style={{ color: '#555', fontSize: '0.7rem' }}>{a.file_size ? Math.round(a.file_size / 1024) + ' KB' : 'Clicca per aprire'}</div>
                                        </div>
                                        <span style={{ color: primaryColor, fontSize: '0.8rem', fontWeight: 900 }}>↗</span>
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ color: '#333', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>Nessun allegato</div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <button style={btnAttachFullStyle}>{loading.attach ? 'CARICAMENTO...' : '📂 CARICA ALLEGATO'}</button>
                        <input type="file" onChange={handleFileAttach} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// PREMIUM STYLES DEFINITION
const toastStyle = (c) => ({ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: c, color: '#fff', padding: '15px 40px', borderRadius: '50px', fontWeight: 900, zIndex: 10000, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' });
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(15px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContent = { backgroundColor: '#111', padding: '40px', borderRadius: '40px', border: '1px solid #333', maxWidth: '450px', width: '90%' };
const btnModalCancel = { background: '#222', color: '#888', border: 'none', padding: '15px 30px', borderRadius: '15px', cursor: 'pointer', fontWeight: 900 };
const btnModalConfirm = (c) => ({ background: c, color: '#000', border: 'none', padding: '15px 30px', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' });
const btnModalDanger = { background: '#ff4444', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' };
const idBadgeStyle = (c) => ({ color: c, fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px', background: `${c}11`, padding: '6px 15px', borderRadius: '50px', border: `1px solid ${c}33` });
const btnSaveStyle = (c) => ({ backgroundColor: c, color: '#000', border: 'none', padding: '18px 45px', borderRadius: '20px', fontWeight: 900, cursor: 'pointer', boxShadow: `0 10px 30px ${c}44` });
const btnBackStyle = { background: 'none', color: '#666', border: '1px solid #333', padding: '18px 30px', borderRadius: '20px', fontWeight: 900, cursor: 'pointer' };
const tabStyle = (a, c) => ({ padding: '25px 35px', border: 'none', background: a ? '#000' : 'transparent', color: a ? c : '#666', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', borderBottom: a ? `4px solid ${c}` : 'none', whiteSpace: 'nowrap', transition: '0.3s' });
const sectionBox = { backgroundColor: '#111', padding: '35px', borderRadius: '32px', border: '1px solid #222' };
const sectionTitle = (c) => ({ color: '#fff', fontSize: '1.2rem', fontWeight: 900, margin: '0 0 25px 0', borderLeft: `6px solid ${c}`, paddingLeft: '20px' });
const megaLabel = (c) => ({ color: c, fontSize: '0.7rem', fontWeight: 900, display: 'block', marginBottom: '10px', letterSpacing: '1px' });
const premiumInput = { width: '100%', background: '#000', border: '1px solid #333', color: '#fff', fontSize: '1.1rem', padding: '18px', borderRadius: '15px' };
const premiumSelect = { width: '100%', background: '#000', border: '1px solid #333', color: '#fff', fontSize: '1.1rem', padding: '18px', borderRadius: '15px', cursor: 'pointer' };
const ultraTextAreaStyle = { width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '30px', borderRadius: '24px', minHeight: '350px', fontSize: '1.2rem', lineHeight: '1.7', outline: 'none' };
const fieldContainerStyle = { background: '#111', padding: '22px', borderRadius: '20px', border: '1px solid #222' };
const photoSection = { display: 'flex', gap: '30px', alignItems: 'center', background: '#111', padding: '30px', borderRadius: '32px', border: '1px dashed #333' };
const photoDropBox = (c) => ({ width: '150px', height: '150px', backgroundColor: '#000', border: `3px dashed ${c}`, borderRadius: '30px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const btnAddNoteStyle = (c) => ({ width: '100%', background: c, color: '#000', border: 'none', padding: '22px', borderRadius: '100px', fontWeight: 900, fontSize: '1.1rem', boxShadow: `0 15px 30px ${c}22` });
const darkInputArea = { width: '100%', background: '#ccc', border: 'none', color: '#111', padding: '25px', borderRadius: '25px', minHeight: '180px', fontSize: '1.1rem', fontWeight: 600, resize: 'none' };
const noteItemBox = (c) => ({ backgroundColor: '#111', padding: '25px', borderRadius: '25px', borderLeft: `8px solid ${c}` });
const attachPill = { backgroundColor: '#1a1a1a', padding: '8px 15px', borderRadius: '12px', fontSize: '0.7rem', border: '1px solid #333' };
const btnAttachFullStyle = { width: '100%', background: 'none', color: '#FFCC00', border: '1px solid #FFCC00', padding: '20px', borderRadius: '100px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' };
const btnActionStyle = (c) => ({ width: '100%', background: `${c}22`, color: c, border: `2px solid ${c}`, padding: '22px', borderRadius: '20px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', transition: '0.3s', textAlign: 'center' });
