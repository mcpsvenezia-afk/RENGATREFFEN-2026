/**
 * 🧬 COMPONENT: ContactForm v4.0
 * Features: DB Integration, Multi-file Attachment Manager
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ContactForm = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        cognome: '',
        email: '',
        note: ''
    });
    const [files, setFiles] = useState([]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Inserimento Messaggio
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .insert([{
                    name: `${formData.nome} ${formData.cognome}`,
                    email: formData.email,
                    message: formData.note,
                    status: 'Nuovo'
                }])
                .select();

            if (msgError) throw msgError;
            const messageId = msgData[0].id;

            // 2. Upload Allegati (se presenti)
            if (files.length > 0) {
                for (const file of files) {
                    const fileName = `${messageId}-${Date.now()}-${file.name}`;
                    const filePath = `messages/${fileName}`;

                    const { error: upError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file);

                    if (upError) throw upError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(filePath);

                    // Salva riferimento nel DB
                    await supabase.from('crm_attachments').insert([{
                        message_id: messageId,
                        file_url: publicUrl,
                        file_name: file.name,
                        file_size: file.size
                    }]);
                }
            }

            // Successo
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Messaggio Inviato!',
                    text: 'Abbiamo ricevuto la tua richiesta e i documenti allegati.',
                    icon: 'success',
                    confirmButtonColor: '#00E5FF', // Cyan color for messages
                    color: '#000',
                    background: '#fff'
                });
            }

            setFormData({ nome: '', cognome: '', email: '', note: '' });
            setFiles([]);

        } catch (err) {
            console.error('Error sending message:', err);
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Errore!',
                    text: 'Non è stato possibile inviare il messaggio: ' + err.message,
                    icon: 'error',
                    confirmButtonColor: '#00E5FF'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <div style={gridRowStyle}>
                <div style={inputGroupStyle}>
                    <label style={labelStyle}>Nome</label>
                    <input
                        type="text" name="nome" required
                        placeholder="Il tuo nome"
                        value={formData.nome} onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label style={labelStyle}>Cognome</label>
                    <input
                        type="text" name="cognome" required
                        placeholder="Il tuo cognome"
                        value={formData.cognome} onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
            </div>

            <div style={inputGroupStyle}>
                <label style={labelStyle}>Email</label>
                <input
                    type="email" name="email" required
                    placeholder="tua@email.com"
                    value={formData.email} onChange={handleChange}
                    style={inputStyle}
                />
            </div>

            <div style={inputGroupStyle}>
                <label style={labelStyle}>Note / Messaggio</label>
                <textarea
                    name="note" required
                    placeholder="Scrivi qui il tuo messaggio..."
                    rows="4"
                    value={formData.note} onChange={handleChange}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                ></textarea>
            </div>

            <div style={inputGroupStyle}>
                <label style={labelStyle}>Allegati (Documenti, Foto, ecc.)</label>
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ ...inputStyle, padding: '10px' }}
                />
                {files.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#00E5FF' }}>
                        📂 {files.length} file selezionati
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '16px',
                    marginTop: '20px',
                    backgroundColor: '#00E5FF', // Distinctive Cyan for items related to messages
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 229, 255, 0.3)'
                }}
            >
                {loading ? 'CARICAMENTO...' : 'INVIA MESSAGGIO'}
            </button>
        </form>
    );
};

// Styles
const formStyle = {
    maxWidth: '500px',
    width: '100%',
    padding: '30px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 229, 255, 0.2)', // Cyan border
    marginTop: '30px'
};

const gridRowStyle = { display: 'flex', gap: '20px', marginBottom: '20px' };
const inputGroupStyle = { flex: 1, marginBottom: '20px' };
const labelStyle = { display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(0, 0, 0, 0.3)', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };

export default ContactForm;
