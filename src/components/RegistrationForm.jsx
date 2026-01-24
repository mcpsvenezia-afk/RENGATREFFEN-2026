import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const RegistrationForm = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        team_name: '',
        p1_nome: '',
        p1_cognome: '',
        p1_email: '',
        p2_nome: '',
        p2_cognome: '',
        p2_email: '',
        moto: '',
        phone: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            team_name: formData.team_name,
            nome: formData.p1_nome, // Mapped to 'nome' in DB
            cognome: formData.p1_cognome, // Mapped to 'cognome' in DB
            email: formData.p1_email, // Mapped to 'email' in DB
            partner_name: `${formData.p2_nome} ${formData.p2_cognome}`, // Mapped to 'partner_name'
            telefono: formData.phone,
            moto: formData.moto,
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('registrations')
                .insert([payload]);

            if (error) throw error;

            // Success
            Swal.fire({
                title: 'Iscrizione Inviata!',
                text: 'Il tuo team è stato registrato. Riceverai una mail con le info per il bonifico.',
                icon: 'success',
                confirmButtonColor: '#FFCC00',
                background: '#fff',
                color: '#000'
            });

            // Reset
            setFormData({
                team_name: '', p1_nome: '', p1_cognome: '', p1_email: '',
                p2_nome: '', p2_cognome: '', p2_email: '', moto: '', phone: ''
            });

        } catch (err) {
            console.error('Error adding registration:', err);
            Swal.fire({
                title: 'Errore!',
                text: 'Qualcosa è andato storto. Riprova più tardi.',
                icon: 'error',
                confirmButtonColor: '#000'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nome del Team</label>
                <input
                    type="text" name="team_name" required
                    placeholder="Nome di battaglia del team"
                    value={formData.team_name} onChange={handleChange}
                    style={inputStyle}
                />
            </div>

            <div style={{ margin: '30px 0 15px', borderBottom: '2px solid #FFCC00', color: '#FFCC00', fontWeight: '900', letterSpacing: '2px' }}>
                PILOTA 1 (CAPITANO)
            </div>

            <div className="form-row" style={rowStyle}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Nome</label>
                    <input type="text" name="p1_nome" required placeholder="Mario" value={formData.p1_nome} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Cognome</label>
                    <input type="text" name="p1_cognome" required placeholder="Rossi" value={formData.p1_cognome} onChange={handleChange} style={inputStyle} />
                </div>
            </div>
            <div style={{ marginTop: '15px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" name="p1_email" required placeholder="mario.rossi@email.com" value={formData.p1_email} onChange={handleChange} style={inputStyle} />
            </div>

            <div style={{ margin: '30px 0 15px', borderBottom: '2px solid #E6007E', color: '#E6007E', fontWeight: '900', letterSpacing: '2px' }}>
                PILOTA 2 (PARTNER)
            </div>

            <div className="form-row" style={rowStyle}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Nome</label>
                    <input type="text" name="p2_nome" required placeholder="Luigi" value={formData.p2_nome} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Cognome</label>
                    <input type="text" name="p2_cognome" required placeholder="Verdi" value={formData.p2_cognome} onChange={handleChange} style={inputStyle} />
                </div>
            </div>
            <div style={{ marginTop: '15px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" name="p2_email" required placeholder="luigi.verdi@email.com" value={formData.p2_email} onChange={handleChange} style={inputStyle} />
            </div>

            <div style={{ margin: '30px 0 15px', borderBottom: '1px solid #ddd' }}></div>

            <div className="form-row" style={rowStyle}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Moto (Entrambe)</label>
                    <input type="text" name="moto" required placeholder="es. Teneré 700 & Tuareg 660" value={formData.moto} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Telefono Referente</label>
                    <input type="tel" name="phone" required placeholder="+39 333 ..." value={formData.phone} onChange={handleChange} style={inputStyle} />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '15px',
                    marginTop: '30px',
                    backgroundColor: loading ? '#ccc' : '#FFCC00',
                    color: '#000',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'transform 0.2s'
                }}
            >
                {loading ? 'INVIO IN CORSO...' : 'INVIA ISCRIZIONE'}
            </button>
        </form>
    );
};

// Styles
const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '1rem',
    boxSizing: 'border-box'
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase'
};

const rowStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px'
};

export default RegistrationForm;
