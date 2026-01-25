/**
 * 🧬 COMPONENT: CRM Detail Panel v2.0
 * Goal: Detailed view with TABS, Photo display, and full CRUD for notes/items
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CRMDetail({ item, type, onBack, onRefresh }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isNoteLoading, setIsNoteLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editNoteContent, setEditNoteContent] = useState('');

    const noteTable = type === 'registration' ? 'registration_notes' : 'message_notes';
    const foreignKey = type === 'registration' ? 'registration_id' : 'message_id';

    useEffect(() => {
        if (item) fetchNotes();
    }, [item]);

    async function fetchNotes() {
        const { data, error } = await supabase
            .from(noteTable)
            .select('*')
            .eq(foreignKey, item.id)
            .order('created_at', { ascending: true });
        if (!error) setNotes(data);
    }

    async function addNote() {
        if (!newNote.trim()) return;
        setIsNoteLoading(true);
        const { error } = await supabase.from(noteTable).insert([
            { [foreignKey]: item.id, content: newNote, admin_name: 'Admin' }
        ]);
        if (error) {
            console.error('Note Error:', error);
            alert('Errore nel salvataggio della nota: ' + error.message);
        } else {
            setNewNote('');
            fetchNotes();
        }
        setIsNoteLoading(false);
    }

    async function deleteItem() {
        if (!confirm(`⚠️ ELIMINAZIONE DEFINITIVA: Sei sicuro di voler cancellare questo elemento?`)) return;
        const table = type === 'registration' ? 'registrations' : 'messages';
        const { error } = await supabase.from(table).delete().eq('id', item.id);
        if (!error) {
            onRefresh();
            onBack();
        } else {
            alert('Errore durante la cancellazione: ' + error.message);
        }
    }

    // Tab Definitions for Registration
    const regTabs = [
        { id: 'general', label: 'GENERICI', fields: ['team_name', 'team_role', 'moto_details', 'is_mcps_member', 'mcps_delegation', 'is_fango_tours_member', 'request_fango_tours_membership'] },
        { id: 'personal', label: 'PILOTA & PARTNER', fields: ['nome', 'cognome', 'email', 'telefono', 'codice_fiscale', 'citta_nascita', 'citta_residenza', 'via_residenza', 'civico_residenza', 'cap_residenza', 'secondo_nome', 'secondo_cognome', 'secondo_cellulare'] },
        { id: 'awareness', label: 'REQUISITI/SALUTE', fields: ['has_roadbook_skill', 'understand_treasure_hunt', 'understand_knobby_tires', 'understand_team_of_2', 'understand_donation_no_refund', 'understand_rain_or_shine', 'food_preferences', 'emergency_contact_phone', 'emergency_contact_info'] },
        { id: 'media', label: 'PRIVACY & BIO', fields: ['authorize_media', 'authorize_pilot_profile', 'pilot_photo', 'pilot_bio'] }
    ];

    const renderFieldValue = (key, value) => {
        if (!value) return <span style={{ color: '#444' }}>-</span>;

        // Specifc display for Photo
        if (key === 'pilot_photo') {
            return (
                <div style={{ marginTop: '10px' }}>
                    <div style={{ width: '100px', height: '100px', backgroundColor: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #FFCC00' }}>
                        {typeof value === 'string' && value.includes('http') ? (
                            <img src={value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '0.7rem', color: '#888', textAlign: 'center' }}>📷 {value}</span>
                        )}
                    </div>
                </div>
            );
        }

        return <div style={{ fontSize: '0.9rem', color: '#fff' }}>{String(value)}</div>;
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '30px', animation: 'fadeIn 0.3s ease' }}>

            {/* LEFT COLUMN: DATA TABS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: '#1e1e1e', borderRadius: '16px', border: '1px solid #333', overflow: 'hidden' }}>
                    <div style={{ padding: '30px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', color: '#FFCC00', margin: 0 }}>{type === 'registration' ? item.team_name : item.name}</h2>
                            <p style={{ color: '#888', margin: '5px 0 0 0' }}>{type === 'registration' ? `${item.nome} ${item.cognome}` : item.email}</p>
                        </div>
                        <button onClick={deleteItem} style={{ background: '#4a1111', color: '#ff4444', border: '1px solid #ff4444', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ ELIMINA</button>
                    </div>

                    {type === 'registration' && (
                        <div style={{ display: 'flex', gap: '2px', backgroundColor: '#111', padding: '5px' }}>
                            {regTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        flex: 1, padding: '12px', border: 'none', backgroundColor: activeTab === tab.id ? '#1e1e1e' : 'transparent',
                                        color: activeTab === tab.id ? '#FFCC00' : '#666', fontWeight: '900', fontSize: '0.7rem', cursor: 'pointer', transition: '0.3s'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ padding: '30px', minHeight: '400px' }}>
                        {type === 'registration' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                {regTabs.find(t => t.id === activeTab).fields.map(field => (
                                    <div key={field} style={{ backgroundColor: '#262626', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                                        <label style={{ color: '#FFCC00', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                                            {field.replace(/_/g, ' ')}
                                        </label>
                                        {renderFieldValue(field, item[field])}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ backgroundColor: '#262626', padding: '25px', borderRadius: '12px', border: '1px solid #FFCC00', lineHeight: '1.6', fontSize: '1.1rem' }}>
                                {item.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: CRM NOTES */}
            <div style={{ backgroundColor: '#1e1e1e', borderRadius: '16px', border: '1px solid #333', padding: '25px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.8rem', color: '#FFCC00', fontWeight: '900', letterSpacing: '2px', margin: '0 0 20px 0' }}>CRM ACTIVITY LOG</h3>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', marginBottom: '20px', maxHeight: '500px' }}>
                    {notes.length === 0 ? (
                        <p style={{ color: '#444', textAlign: 'center', fontSize: '0.8rem' }}>Nessuna attività registrata.</p>
                    ) : (
                        notes.map(note => (
                            <div key={note.id} style={{ backgroundColor: '#111', padding: '15px', borderRadius: '12px', borderLeft: '3px solid #FFCC00' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{new Date(note.created_at).toLocaleString()}</span>
                                    <span style={{ color: '#FFCC00', fontWeight: 'bold' }}>ADMIN</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: '1.5' }}>{note.content}</div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '20px' }}>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Aggiungi una nota di gestione..."
                        style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '10px', resize: 'none', minHeight: '80px', outline: 'none' }}
                    />
                    <button
                        onClick={addNote}
                        disabled={isNoteLoading}
                        style={{ width: '100%', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '12px', borderRadius: '50px', fontWeight: '900', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        {isNoteLoading ? 'INVIO...' : 'AGGIUNGI NOTA'}
                    </button>
                </div>
            </div>
        </div>
    );
}
