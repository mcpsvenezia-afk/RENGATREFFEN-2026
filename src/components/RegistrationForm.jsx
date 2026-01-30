import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const RegistrationForm = () => {
    const [loading, setLoading] = useState(false);
    const [passengers, setPassengers] = useState([]);
    const [lunchGuests, setLunchGuests] = useState([]);

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
        importo_dovuto: 85
    });

    const calculateTotal = (formula, passCount, guestCount) => {
        let base = 0;
        if (formula === 'Caccia_MCPS') base = 75;
        else if (formula === 'Caccia_NON_MCPS') base = 85;
        else if (formula === 'Discovery') base = 85;
        else if (formula === '4x4') base = 85;

        let total = base;
        if (formula === '4x4') {
            total += (passCount * 30);
        }
        total += (guestCount * 15);
        return total;
    };

    const currentTotal = calculateTotal(formData.formula_partecipazione, passengers.length, lunchGuests.length);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addPassenger = () => setPassengers([...passengers, '']);
    const removePassenger = (index) => setPassengers(passengers.filter((_, i) => i !== index));
    const updatePassenger = (index, name) => {
        const newPass = [...passengers];
        newPass[index] = name;
        setPassengers(newPass);
    };

    const addLunchGuest = () => setLunchGuests([...lunchGuests, '']);
    const removeLunchGuest = (index) => setLunchGuests(lunchGuests.filter((_, i) => i !== index));
    const updateLunchGuest = (index, name) => {
        const newGuests = [...lunchGuests];
        newGuests[index] = name;
        setLunchGuests(newGuests);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const finalPayload = {
            ...formData,
            passeggeri_4x4: passengers.length,
            nomi_passeggeri_4x4: passengers.join(', '),
            pranzo_accompagnatori: lunchGuests.length,
            nomi_ospiti_pranzo: lunchGuests.join(', '),
            importo_dovuto: currentTotal
        };

        try {
            const { submitRegistration } = await import('../core/logic-database-v1');
            const result = await submitRegistration(finalPayload);

            if (!result.success) throw new Error(result.error);

            if (window.Swal) {
                let statusText = `Riceverai una mail con le info per il bonifico di € ${currentTotal},00.`;
                if (result.stato === 'Lista_Attesa') statusText = 'Purtroppo siamo al completo. Sei stato inserito in lista d\'attesa.';
                else if (result.stato === 'In_Valutazione') statusText = 'La tua iscrizione è in fase di valutazione (manca il partner). Ti contatteremo a breve.';

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
                moto_details: '', telefono: '', formula_partecipazione: 'Caccia_NON_MCPS'
            });
            setPassengers([]);
            setLunchGuests([]);

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
                            background: formData.formula_partecipazione === opt.id ? 'rgba(255,204,0,0.1)' : 'rgba(255,255,255,0.08)',
                            borderRadius: '12px', border: `1px solid ${formData.formula_partecipazione === opt.id ? '#FFCC00' : 'rgba(255,255,255,0.15)'}`,
                            cursor: 'pointer', transition: '0.3s', color: '#fff'
                        }}>
                            <input
                                type="radio" name="formula_partecipazione" value={opt.id}
                                checked={formData.formula_partecipazione === opt.id}
                                onChange={handleChange}
                                style={{ width: '20px', height: '20px', accentColor: '#FFCC00' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#fff' }}>{opt.label}</div>
                                <div style={{ color: '#FFCC00', fontWeight: 'bold', fontSize: '0.9rem' }}>{opt.price}</div>
                            </div>
                        </label>
                    ))}
                </div>

                {formData.formula_partecipazione === '4x4' && (
                    <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px dashed #444' }}>
                        <label style={labelStyle}>Passeggeri Extra nel 4x4 (€ 30 cad.)</label>
                        {passengers.map((p, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    type="text" placeholder={`Nome Passeggero ${i + 1}`} value={p}
                                    onChange={(e) => updatePassenger(i, e.target.value)}
                                    style={inputStyle} required
                                />
                                <button type="button" onClick={() => removePassenger(i)} style={{ background: 'rgba(230,0,126,0.2)', border: '1px solid #E6007E', color: '#E6007E', borderRadius: '8px', padding: '0 15px', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={addPassenger} style={{ marginTop: '5px', background: 'none', border: '2px dashed #FFCC00', color: '#FFCC00', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>
                            + AGGIUNGI PASSEGGERO
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px dashed #444' }}>
                    <label style={labelStyle}>Ospiti solo pranzo (€ 15 cad.)</label>
                    {lunchGuests.map((g, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="text" placeholder={`Nome Ospite ${i + 1}`} value={g}
                                onChange={(e) => updateLunchGuest(i, e.target.value)}
                                style={inputStyle}
                            />
                            <button type="button" onClick={() => removeLunchGuest(i)} style={{ background: 'rgba(230,0,126,0.2)', border: '1px solid #E6007E', color: '#E6007E', borderRadius: '8px', padding: '0 15px', cursor: 'pointer' }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addLunchGuest} style={{ marginTop: '5px', background: 'none', border: '2px dashed #FFCC00', color: '#FFCC00', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>
                        + AGGIUNGI OSPITE PRANZO
                    </button>
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
    marginBottom: '8px',
    fontSize: '0.85rem',
    color: '#ccc',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const rowStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px'
};

export default RegistrationForm;
