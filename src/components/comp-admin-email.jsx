import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export function EmailTab({ registrations }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    // Filtra le registrazioni in base alla ricerca
    const filteredRegistrations = registrations.filter(r => {
        if (!r.email) return false;
        const search = searchTerm.toLowerCase();
        return (
            (r.nome && r.nome.toLowerCase().includes(search)) ||
            (r.cognome && r.cognome.toLowerCase().includes(search)) ||
            (r.email.toLowerCase().includes(search)) ||
            (r.team_name && r.team_name.toLowerCase().includes(search))
        );
    });

    const handleSelectAll = () => {
        if (selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0) {
            setSelectedIds(new Set());
        } else {
            const newSelected = new Set(filteredRegistrations.map(r => r.id));
            setSelectedIds(newSelected);
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSend = async () => {
        if (selectedIds.size === 0) {
            Swal.fire({ title: 'NESSUN DESTINATARIO', text: 'Seleziona almeno un contatto.', icon: 'warning', background: '#111', color: '#fff' });
            return;
        }
        if (!subject.trim() || !body.trim()) {
            Swal.fire({ title: 'CAMPI MANCANTI', text: 'Inserisci oggetto e contenuto.', icon: 'warning', background: '#111', color: '#fff' });
            return;
        }

        const result = await Swal.fire({
            title: 'CONFERMA INVIO',
            text: `Stai per inviare ${selectedIds.size} email. Procedere?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'SÌ, INVIA',
            cancelButtonText: 'ANNULLA',
            background: '#111',
            color: '#fff',
            confirmButtonColor: '#E6007E'
        });

        if (!result.isConfirmed) return;

        setSending(true);
        try {
            const recipients = registrations
                .filter(r => selectedIds.has(r.id))
                .map(r => ({ email: r.email, name: r.nome }));

            // Chunking per evitare limiti (max 100 per volta)
            const chunkSize = 50;
            for (let i = 0; i < recipients.length; i += chunkSize) {
                const chunk = recipients.slice(i, i + chunkSize);

                const response = await fetch('/api/send-bulk-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipients: chunk,
                        subject: subject,
                        htmlContent: body.replace(/\n/g, '<br>') // Simple conversion
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Errore invio batch');
                }
            }

            Swal.fire({ title: 'INVIO COMPLETATO', text: `Email inviate a ${recipients.length} contatti.`, icon: 'success', background: '#111', color: '#fff' });
            setSubject('');
            setBody('');
            setSelectedIds(new Set());

        } catch (err) {
            console.error(err);
            Swal.fire({ title: 'ERRORE INVIO', text: err.message, icon: 'error', background: '#111', color: '#fff' });
        } finally {
            setSending(false);
        }
    };

    const inputStyle = {
        background: '#1a1a1f',
        color: '#fff',
        border: '1px solid #333',
        padding: '15px',
        borderRadius: '12px',
        fontSize: '1rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box'
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#00E5FF', fontSize: '2rem', fontWeight: 900, margin: 0 }}>CENTRO COMUNICAZIONI 📧</h2>
                <p style={{ color: '#888', margin: '5px 0' }}>Seleziona i destinatari e invia comunicazioni massive.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '30px', height: '70vh' }}>
                {/* COLONNA SINISTRA: LISTA CONTATTI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#111', borderRadius: '24px', padding: '20px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Cerca nome, email, team..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...inputStyle, padding: '10px 15px', fontSize: '0.9rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#666', fontWeight: 900 }}>
                        <span>{filteredRegistrations.length} CONTATTI TROVATI</span>
                        <button
                            onClick={handleSelectAll}
                            style={{ background: 'transparent', border: 'none', color: '#00E5FF', cursor: 'pointer', fontWeight: 900 }}
                        >
                            {selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0 ? 'DESELEZIONA TUTTI' : 'SELEZIONA TUTTI'}
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {filteredRegistrations.map(r => (
                            <div
                                key={r.id}
                                onClick={() => handleSelectOne(r.id)}
                                style={{
                                    padding: '10px 15px',
                                    borderRadius: '12px',
                                    background: selectedIds.has(r.id) ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: selectedIds.has(r.id) ? '1px solid #00E5FF' : '1px solid transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: '0.2s'
                                }}
                            >
                                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                    <div style={{ fontWeight: 900, color: '#fff', fontSize: '0.9rem' }}>{r.nome} {r.cognome}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{r.email}</div>
                                </div>
                                {selectedIds.has(r.id) && <span style={{ color: '#00E5FF', fontWeight: 900 }}>✓</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLONNA DESTRA: EDITOR EMAIL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#111', borderRadius: '24px', padding: '30px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>COMPONI MESSAGGIO</h3>
                        <span style={{ fontSize: '0.9rem', color: selectedIds.size > 0 ? '#4CAF50' : '#666', fontWeight: 900 }}>
                            {selectedIds.size} DESTINATARI SELEZIONATI
                        </span>
                    </div>

                    <input
                        type="text"
                        placeholder="Oggetto dell'email"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        style={{ ...inputStyle, fontWeight: 900, fontSize: '1.2rem' }}
                    />

                    <textarea
                        placeholder="Scrivi qui il tuo messaggio... (Supporta Copia/Incolla e Emoji)"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        style={{ ...inputStyle, flex: 1, resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#666', maxWidth: '300px', textAlign: 'right' }}>
                            Usa <strong style={{ color: '#888' }}>{`{{NOME}}`}</strong> per inserire il nome del destinatario. (Es: Ciao {`{{NOME}}`}, sei invitato...)
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            style={{
                                background: sending ? '#666' : '#E6007E',
                                color: '#fff',
                                padding: '15px 40px',
                                borderRadius: '100px',
                                border: 'none',
                                fontWeight: 900,
                                fontSize: '1rem',
                                cursor: sending ? 'not-allowed' : 'pointer',
                                boxShadow: sending ? 'none' : '0 10px 30px rgba(230,0,126,0.4)',
                                transition: '0.3s'
                            }}
                        >
                            {sending ? 'INVIO IN CORSO...' : 'INVIA MESSAGGIO 🚀'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
