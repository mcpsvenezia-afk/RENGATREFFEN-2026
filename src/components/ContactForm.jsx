import React, { useState } from 'react';

const ContactForm = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        cognome: '',
        email: '',
        note: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulazione Invio (DB integration later)
        setTimeout(() => {
            setLoading(false);

            // SweetAlert2 via CDN (già presente in index.html)
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Messaggio Ricevuto!',
                    text: 'Grazie per averci contattato. Ti risponderemo al più presto.',
                    icon: 'success',
                    confirmButtonColor: '#ffcc00',
                    color: '#000',
                    background: '#fff'
                });
            } else {
                alert('Messaggio inviato con successo!');
            }

            setFormData({ nome: '', cognome: '', email: '', note: '' });
        }, 1500);
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

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '16px',
                    marginTop: '20px',
                    backgroundColor: '#FFCC00',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(255, 204, 0, 0.3)'
                }}
            >
                {loading ? 'INVIO IN CORSO...' : 'INVIA MESSAGGIO'}
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
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginTop: '30px'
};

const gridRowStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px'
};

const inputGroupStyle = {
    flex: 1,
    marginBottom: '20px'
};

const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#ccc',
    fontSize: '0.9rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box'
};

export default ContactForm;
