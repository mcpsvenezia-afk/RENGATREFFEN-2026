import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const RegistrationForm = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        team_name: '',
        nome: '',
        cognome: '',
        email: '',
        secondo_nome: '',
        secondo_cognome: '',
        secondo_cellulare: '',
        moto_details: '',
        telefono: '',
        formula_partecipazione: 'Caccia_NON_MCPS',
        passeggeri_4x4: 0,
        pranzo_accompagnatori: 0,
        importo_dovuto: 85
    });

    const calculateTotal = (data) => {
        let base = 0;
        if (data.formula_partecipazione === 'Caccia_MCPS') base = 75;
        else if (data.formula_partecipazione === 'Caccia_NON_MCPS') base = 85;
        else if (data.formula_partecipazione === 'Discovery') base = 85;
        else if (data.formula_partecipazione === '4x4') base = 85;

        let total = base;
        if (data.formula_partecipazione === '4x4') {
            total += (parseInt(data.passeggeri_4x4 || 0) * 30);
        }
        total += (parseInt(data.pranzo_accompagnatori || 0) * 30);
        return total;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newData = { ...formData, [name]: value };

        // Update total if price-sensitive fields change
        if (['formula_partecipazione', 'passeggeri_4x4', 'pranzo_accompagnatori'].includes(name)) {
            newData.importo_dovuto = calculateTotal(newData);
        }

        setFormData(newData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Import the logic dynamically to avoid issues
            const { submitRegistration } = await import('../core/logic-database-v1');
            const result = await submitRegistration(formData);

            if (!result.success) throw new Error(result.error);

            // Success
            if (window.Swal) {
                let statusText = 'Riceverai una mail con le info per il bonifico.';
                if (result.stato === 'Lista_Attesa') {
                    statusText = 'Purtroppo siamo al completo. Sei stato inserito in lista d\'attesa.';
                } else if (result.stato === 'In_Valutazione') {
                    statusText = 'La tua iscrizione è in fase di valutazione (manca il partner). Ti contatteremo a breve.';
                }

                window.Swal.fire({
                    title: result.stato === 'Lista_Attesa' ? 'LISTA D\'ATTESA' : 'Iscrizione Inviata!',
                    text: statusText,
                    icon: result.stato === 'Lista_Attesa' ? 'warning' : 'success',
                    confirmButtonColor: '#FFCC00'
                });
            }

            // Reset
            setFormData({
                team_name: '', nome: '', cognome: '', email: '',
                secondo_nome: '', secondo_cognome: '', secondo_cellulare: '',
                moto_details: '', telefono: '', formula_partecipazione: 'Caccia_NON_MCPS',
                passeggeri_4x4: 0, pranzo_accompagnatori: 0, importo_dovuto: 85
            });

        } catch (err) {
            console.error('Error adding registration:', err);
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Errore!',
                    text: err.message || 'Qualcosa è andato storto.',
                    icon: 'error',
                    confirmButtonColor: '#E6007E'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%', color: '#fff' }}>
            <div className="form-section-react" style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#FFCC00', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px' }}>1. Formula di Partecipazione</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[
                        { id: 'Caccia_MCPS', label: 'Caccia al Tesoro (Iscritti MCPS)', price: '€ 75' },
                        { id: 'Caccia_NON_MCPS', label: 'Caccia al Tesoro (NON Iscritti MCPS)', price: '€ 85' },
                        { id: 'Discovery', label: 'Formula DISCOVERY', price: '€ 85' },
                        { id: '4x4', label: 'Formula 4x4', price: '€ 85 (+ € 30/pass)' }
                    ].map(opt => (
                        <label key={opt.id} style={{
                            display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px',
                            background: formData.formula_partecipazione === opt.id ? 'rgba(255,204,0,0.1)' : 'rgba(255,255,255,0.05)',
                            borderRadius: '12px', border: `1px solid ${formData.formula_partecipazione === opt.id ? '#FFCC00' : 'rgba(255,255,255,0.1)'}`,
                            cursor: 'pointer', transition: '0.3s'
                        }}>
                            <input
                                type="radio" name="formula_partecipazione" value={opt.id}
                                checked={formData.formula_partecipazione === opt.id}
                                onChange={handleChange}
                                style={{ width: '20px', height: '20px', accentColor: '#FFCC00' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{opt.label}</div>
                                <div style={{ color: '#FFCC00', fontWeight: 'bold', fontSize: '0.9rem' }}>{opt.price}</div>
                            </div>
                        </label>
                    ))}
                </div>

                {formData.formula_partecipazione === '4x4' && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                        <label style={labelStyle}>Numero Passeggeri Extra (€ 30/cad)</label>
                        <input type="number" name="passeggeri_4x4" min="0" value={formData.passeggeri_4x4} onChange={handleChange} style={inputStyle} />
                    </div>
                )}

                <div style={{ marginTop: '20px' }}>
                    <label style={labelStyle}>Accompagnatori solo pranzo (€ 30/cad)</label>
                    <input type="number" name="pranzo_accompagnatori" min="0" value={formData.pranzo_accompagnatori} onChange={handleChange} style={inputStyle} />
                </div>
            </div>

            <div className="form-section-react" style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#FFCC00', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px' }}>2. Dati Team & Moto</h3>
                <div className="form-group">
                    <label style={labelStyle}>Nome del Team</label>
                    <input type="text" name="team_name" required placeholder="Nome del team" value={formData.team_name} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ marginTop: '20px' }}>
                    <label style={labelStyle}>Veicolo (Marca, Modello, Targa)</label>
                    <input type="text" name="moto_details" required placeholder="es. KTM 890, AA123BB" value={formData.moto_details} onChange={handleChange} style={inputStyle} />
                </div>
            </div>

            <div className="total-box" style={{
                background: 'rgba(230,0,126,0.1)', border: '2px solid #E6007E', padding: '30px', borderRadius: '20px',
                textAlign: 'center', marginBottom: '30px'
            }}>
                <div style={{ color: '#E6007E', fontWeight: '900', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px' }}>Totale Iscrizione:</div>
                <div style={{ fontSize: '3rem', fontWeight: '950', color: '#E6007E' }}>€ {formData.importo_dovuto},00</div>
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%', padding: '20px', backgroundColor: loading ? '#333' : '#FFCC00',
                    color: '#000', border: 'none', borderRadius: '15px', fontSize: '1.2rem',
                    fontWeight: '900', cursor: loading ? 'wait' : 'pointer', transition: '0.3s'
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
