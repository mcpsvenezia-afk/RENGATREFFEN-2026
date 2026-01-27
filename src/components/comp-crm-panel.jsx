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
import { sendWelcomeEmail, sendApprovalEmail } from '../core/logic-email-v1.js';

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
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
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

    // AUTO-SAVE LOGIC (Debounced 1.5s)
    useEffect(() => {
        const hasChanged = JSON.stringify(localItem) !== JSON.stringify(item);
        if (!hasChanged) return;

        setSaveStatus('saving');
        const timer = setTimeout(() => {
            commitAllChanges(true); // true = silent save
        }, 1500);

        return () => clearTimeout(timer);
    }, [localItem]);

    const handleTabChange = (tabId) => {
        if (activeTab !== tabId) {
            // Se ci sono modifiche pendenti, salva immediatamente prima di cambiare tab
            if (JSON.stringify(localItem) !== JSON.stringify(item)) {
                commitAllChanges(true);
            }
            setActiveTab(tabId);
        }
    };

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

    async function commitAllChanges(silent = false) {
        if (!silent) setLoading(prev => ({ ...prev, saving: true }));
        setSaveStatus('saving');

        try {
            const table = isMsg ? 'messages' : 'registrations';
            const { error } = await supabase.from(table).update(localItem).eq('id', item.id);
            if (error) throw error;

            setSaveStatus('saved');
            if (!silent) showToast('success', 'SINCRONIZZATO');
            onRefresh();

            // Reset "saved" status after 3 seconds
            setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 3000);
        } catch (err) {
            setSaveStatus('error');
            showToast('error', err.message);
        } finally {
            if (!silent) setLoading(prev => ({ ...prev, saving: false }));
        }
    }

    async function handleSendConfirmationEmail() {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const res = await sendApprovalEmail(localItem);
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
                if (!error) { fetchNotes(); showToast('success', 'LOG RIMOSSO'); }
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
        { id: 'comms', label: 'COMUNICAZIONI', fields: [] },
        { id: 'crm', label: 'LOG / CRM', fields: [] }
    ];

    const commsLogs = notes.filter(n => n.content?.includes('🤖 AUTO: Inviata email'));
    const manualNotes = notes.filter(n => !n.content?.includes('🤖 AUTO: Inviata email'));

    return (
        <div data-component="CRMDetail" style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', position: 'relative' }}>

            {status.visible && <div style={toastStyle(status.type === 'success' ? '#4CAF50' : '#E6007E')}>{status.message}</div>}

            {modal.visible && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ color: modal.isDanger ? '#ff4444' : primaryColor, margin: 0 }}>{modal.title}</h3>
                        <p style={{ color: '#fff', fontSize: '1.2rem', margin: '30px 0' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal({ ...modal, visible: false })} style={btnModalCancel}>ANNULLA</button>
                            <button onClick={() => modal.onConfirm()} style={modal.isDanger ? btnModalDanger : btnModalConfirm(primaryColor)}>CONFERMA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER MASTER AREA */}
            <div style={{ backgroundColor: '#1a1b26', borderRadius: '40px', border: '1px solid #2f334d', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.6)' }}>
                <div style={{ padding: '50px 60px', background: 'linear-gradient(135deg, #16161e, #1a1b26)', borderBottom: '1px solid #2f334d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '25px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <h2 style={{ fontSize: '3.4rem', color: primaryColor, margin: 0, fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>{localItem.team_name || localItem.name || localItem.nome}</h2>

                                {/* AUTO-SAVE INDICATOR */}
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, transition: '0.3s', opacity: saveStatus === 'idle' ? 0 : 1, color: saveStatus === 'saving' ? '#aaa' : saveStatus === 'saved' ? '#4CAF50' : '#E6007E', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '8px 15px', borderRadius: '12px' }}>
                                    {saveStatus === 'saving' && <span>⏳ Salvataggio in corso...</span>}
                                    {saveStatus === 'saved' && <span>✅ Dati salvati</span>}
                                    {saveStatus === 'error' && <span>❌ Errore salvataggio</span>}
                                </div>
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <span style={idBadgeStyle(accentColor)}>ISCRIZIONE #{item.id}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <button onClick={onBack} style={btnBackStyle}>CHIUDI</button>
                            <button onClick={() => commitAllChanges(false)} disabled={loading.saving || saveStatus === 'saving'} style={btnSaveStyleSmall(primaryColor)}>{loading.saving ? 'SINCRO...' : '💾 SALVA TUTTO'}</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', backgroundColor: '#16161e', borderBottom: '1px solid #2f334d', padding: '15px 30px' }}>
                    {(isMsg ? [{ id: 'm', label: 'MESSAGGIO' }] : regTabs).map(t => (
                        <button key={t.id} onClick={() => handleTabChange(t.id)} style={tabStyle(activeTab === t.id, primaryColor)}>{t.label}</button>
                    ))}
                </div>

                <div style={{ padding: '60px', minHeight: '650px', background: '#1a1b26' }}>
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
                                    <p style={{ color: '#444', fontSize: '0.75rem', margin: '5px 0 0 0' }}>L'email invierà il template ufficiale a: <strong>{localItem.email}</strong></p>
                                </div>

                                {/* STORICO INVII INTEGRATO NEL GRID */}
                                <div style={{ marginTop: '10px' }}>
                                    <h4 style={{ color: '#555', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '2px' }}>STORICO INVII</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {commsLogs.map(log => (
                                            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px 20px', borderRadius: '15px', border: '1px solid #2f334d' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.5px' }}>✅ INVIATA</div>
                                                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString('it-IT')}</div>
                                                </div>
                                                <button
                                                    onClick={() => deleteNote(log.id)}
                                                    style={{ background: 'rgba(230,0,126,0.1)', border: 'none', color: '#E6007E', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 900, padding: '8px 12px', borderRadius: '8px', textTransform: 'uppercase', transition: '0.3s' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(230,0,126,0.2)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(230,0,126,0.1)'}
                                                >
                                                    Elimina
                                                </button>
                                            </div>
                                        ))}
                                        {commsLogs.length === 0 && (
                                            <div style={{ color: '#444', fontSize: '0.8rem', fontStyle: 'italic' }}>Nessuna comunicazione registrata.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'crm' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px' }}>
                            {/* CRM LOGS (Main side of tab) */}
                            <div style={sectionBox}>
                                <h3 style={sectionTitle(primaryColor)}>REGISTRO ATTIVITÀ CRM</h3>

                                <div style={{ marginBottom: '30px' }}>
                                    <textarea
                                        id="note-input-area"
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        style={darkInputArea}
                                        placeholder="Annota progressi, telefonate o stati..."
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                        {editingNoteId && <span onClick={() => { setEditingNoteId(null); setNewNote(''); }} style={{ color: primaryColor, fontSize: '0.9rem', cursor: 'pointer' }}>ANNULLA MODIFICA</span>}
                                        <div style={{ flex: 1 }}></div>
                                        <button onClick={submitNote} style={btnAddNoteStyle(primaryColor)}>
                                            {editingNoteId ? '💾 AGGIORNA NOTA' : '+ AGGIUNGI NOTA'}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {manualNotes.map(n => (
                                        <div key={n.id} style={noteItemBox(primaryColor)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{ color: primaryColor, fontSize: '0.75rem', fontWeight: 900 }}>{new Date(n.created_at).toLocaleString()}</span>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <span onClick={() => startEditNote(n)} style={{ cursor: 'pointer', opacity: 0.5 }}>✏️</span>
                                                    <span onClick={() => deleteNote(n.id)} style={{ cursor: 'pointer', opacity: 0.5 }}>🗑️</span>
                                                </div>
                                            </div>
                                            <div style={{ color: '#eee', fontSize: '1.05rem', lineHeight: '1.5' }}>{n.content}</div>
                                        </div>
                                    ))}
                                    {manualNotes.length === 0 && <div style={{ textAlign: 'center', color: '#444', padding: '40px' }}>Nessun log CRM presente.</div>}
                                </div>
                            </div>

                            {/* ATTACHMENTS (Side of CRM tab) */}
                            <div style={sectionBox}>
                                <h3 style={sectionTitle(primaryColor)}>📎 ALLEGATI</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    {attachments.map(a => (
                                        <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 15px',
                                            background: '#000',
                                            border: '1px solid #333',
                                            borderRadius: '12px',
                                            textDecoration: 'none'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>📎</span>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.file_name}</div>
                                            </div>
                                        </a>
                                    ))}
                                    {attachments.length === 0 && <div style={{ color: '#444', fontSize: '0.85rem', textAlign: 'center' }}>Nessun allegato</div>}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <button style={btnAttachFullStyle}>{loading.attach ? '...' : '+ CARICA'}</button>
                                    <input type="file" onChange={handleFileAttach} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
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
const idBadgeStyle = (c) => ({ color: c, fontSize: '0.85rem', fontWeight: 900, letterSpacing: '2px', background: `${c}22`, padding: '8px 20px', borderRadius: '50px', border: `2px solid ${c}44`, display: 'inline-block' });
const btnSaveStyle = (c) => ({ backgroundColor: c, color: '#000', border: 'none', padding: '20px 50px', borderRadius: '25px', fontWeight: 900, cursor: 'pointer', boxShadow: `0 15px 40px ${c}44`, fontSize: '1rem', letterSpacing: '1px' });
const btnSaveStyleSmall = (c) => ({ backgroundColor: 'transparent', color: c, border: `2px solid ${c}`, padding: '12px 25px', borderRadius: '15px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem', opacity: 0.6, transition: '0.3s' });
const btnBackStyle = { background: '#24283b', color: '#c0caf5', border: '1px solid #414868', padding: '18px 35px', borderRadius: '25px', fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem' };
const tabStyle = (a, c) => ({ padding: '16px 30px', margin: '6px', border: '2px solid', borderColor: a ? c : 'transparent', background: a ? `${c}22` : '#24283b', color: a ? c : '#9499b8', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', borderRadius: '15px', transition: '0.3s', whiteSpace: 'nowrap', letterSpacing: '0.5px' });
const sectionBox = { backgroundColor: '#24283b', padding: '45px', borderRadius: '35px', border: '1px solid #414868', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' };
const sectionTitle = (c) => ({ color: '#fff', fontSize: '1.4rem', fontWeight: 900, margin: '0 0 35px 0', borderLeft: `8px solid ${c}`, paddingLeft: '25px', letterSpacing: '1px' });
const megaLabel = (c) => ({ color: '#a9b1d6', fontSize: '0.85rem', fontWeight: 900, display: 'block', marginBottom: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' });
const premiumInput = { width: '100%', background: '#16161e', border: '2px solid #414868', color: '#fff', fontSize: '1.2rem', padding: '20px', borderRadius: '18px', fontWeight: 500 };
const premiumSelect = { width: '100%', background: '#16161e', border: '2px solid #414868', color: '#fff', fontSize: '1.2rem', padding: '20px', borderRadius: '18px', cursor: 'pointer', fontWeight: 500 };
const ultraTextAreaStyle = { width: '100%', background: '#16161e', border: '2px solid #414868', color: '#fff', padding: '35px', borderRadius: '30px', minHeight: '400px', fontSize: '1.3rem', lineHeight: '1.8', outline: 'none' };
const fieldContainerStyle = { background: '#24283b', padding: '30px', borderRadius: '25px', border: '2px solid #2f334d' };
const photoSection = { display: 'flex', gap: '40px', alignItems: 'center', background: '#24283b', padding: '40px', borderRadius: '35px', border: '2px dashed #414868' };
const photoDropBox = (c) => ({ width: '180px', height: '180px', backgroundColor: '#16161e', border: `4px dashed ${c}`, borderRadius: '35px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const btnAddNoteStyle = (c) => ({ width: 'auto', minWidth: '220px', background: c, color: '#000', border: 'none', padding: '22px 40px', borderRadius: '100px', fontWeight: 900, fontSize: '1.1rem', boxShadow: `0 15px 35px ${c}33`, cursor: 'pointer' });
const darkInputArea = { width: '100%', background: '#e0e0e0', border: 'none', color: '#111', padding: '30px', borderRadius: '30px', minHeight: '200px', fontSize: '1.2rem', fontWeight: 500, resize: 'none' };
const noteItemBox = (c) => ({ backgroundColor: '#1a1b26', padding: '30px', borderRadius: '30px', borderLeft: `10px solid ${c}`, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' });
const btnAttachFullStyle = { width: '100%', background: 'none', color: '#FFCC00', border: '2px solid #FFCC00', padding: '22px', borderRadius: '100px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' };
const btnActionStyle = (c) => ({ width: '100%', background: `${c}`, color: '#000', border: 'none', padding: '25px', borderRadius: '25px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', transition: '0.3s', textAlign: 'center', boxShadow: `0 10px 30px ${c}44` });
