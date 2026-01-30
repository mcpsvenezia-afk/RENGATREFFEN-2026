import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';

const useMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

const RegistrationForm = () => {
    const [loading, setLoading] = useState(false);
    const [passengers, setPassengers] = useState([]);
    const [lunchGuests, setLunchGuests] = useState([]);

    const [formData, setFormData] = useState({
        team_name: '',
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        moto_details: '',
        formula_partecipazione: 'Caccia_NON_MCPS',

        // Personal Data (Full)
        codice_fiscale: '',
        citta_nascita: '',
        citta_residenza: '',
        via_residenza: '',
        civico_residenza: '',
        cap_residenza: '',

        // Pilot 2 (Optional)
        secondo_nome: '',
        secondo_cognome: '',
        secondo_cellulare: '',

        // Extra Info
        food_preferences: '',
        emergency_contact_phone: '',
        emergency_contact_info: '',

        // Mandatory Choices (Radio)
        is_mcps_member: '',
        authorize_pilot_profile: '',
        is_fango_tours_member: '',
        request_fango_tours_membership: '',
        accept_fango_insurance: '',
        accept_regulation: ''
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

    const isMobile = useMobile();
    const currentTotal = calculateTotal(formData.formula_partecipazione, passengers.length, lunchGuests.length);

    const handleShare = async () => {
        const shareData = {
            title: 'Renga Treffen 2026',
            text: 'Partecipa con me al Renga Treffen 2026! 🏁 Iscriviti qui:',
            url: 'https://www.rengatreffen.it'
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                alert('La condivisione non è supportata su questo browser. Copia il link: https://www.rengatreffen.it');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

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
                let title = 'Iscrizione Inviata!';
                let statusText = `Riceverai una mail con le info per il bonifico di € ${currentTotal},00.`;
                let icon = 'success';

                if (result.is_duplicate) {
                    title = 'ATTENZIONE: DUPLICATO';
                    statusText = 'Risulta già una registrazione a tuo nome. La tua richiesta verrà verificata manualmente.';
                    icon = 'warning';
                } else if (result.stato === 'Lista_Attesa') {
                    title = 'LISTA D\'ATTESA';
                    statusText = 'Purtroppo siamo al completo. Sei stato inserito in lista d\'attesa.';
                    icon = 'warning';
                } else if (result.stato === 'In_Valutazione') {
                    title = 'IN VALUTAZIONE';
                    statusText = 'La tua iscrizione è in fase di valutazione (manca il partner). Ti contatteremo a breve.';
                    icon = 'info';
                }

                window.Swal.fire({
                    title: title,
                    text: statusText,
                    icon: icon,
                    confirmButtonColor: '#FFCC00'
                });
            }

            // Reset
            setFormData({
                team_name: '', nome: '', cognome: '', email: '', telefono: '', moto_details: '',
                formula_partecipazione: 'Caccia_NON_MCPS',
                codice_fiscale: '', citta_nascita: '', citta_residenza: '', via_residenza: '', civico_residenza: '', cap_residenza: '',
                secondo_nome: '', secondo_cognome: '', secondo_cellulare: '',
                food_preferences: '', emergency_contact_phone: '', emergency_contact_info: '',
                is_mcps_member: '', authorize_pilot_profile: '', is_fango_tours_member: '',
                request_fango_tours_membership: '', accept_fango_insurance: '', accept_regulation: ''
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
        <form onSubmit={handleSubmit} style={{ width: '100%', color: '#fff', paddingBottom: isMobile ? '120px' : '0' }}>
            {/* 📱 MOBILE SHARE BUTTON */}
            {isMobile && (
                <button
                    type="button"
                    onClick={handleShare}
                    data-dna="9001-MOBILE-SHARE-BTN"
                    style={{
                        position: 'fixed', top: '10px', right: '10px', zIndex: 1000,
                        backgroundColor: '#FFCC00', border: 'none', borderRadius: '50%',
                        width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>📤</span>
                </button>
            )}
            {/* DNA ROOT FOR MATRIOSKA */}
            <div data-dna="9000-REGISTRATION-FORM" style={{ display: 'none' }}></div>

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
            </div>

            <div className="form-section-react" style={{ background: 'rgba(255,255,255,0.03)', padding: isMobile ? '20px' : '30px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#FFCC00', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>2. Dati Team & Veicolo</h3>
                <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Nome del Team</label>
                        <input type="text" name="team_name" required placeholder="Nome del team" value={formData.team_name} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <label style={labelStyle}>Veicolo (Marca, Modello, Targa)</label>
                    <input type="text" name="moto_details" required placeholder="es. KTM 890, AA123BB" value={formData.moto_details} onChange={handleChange} style={inputStyle} />
                </div>
            </div>

            <div className="form-section-react" style={{ background: 'rgba(255,255,255,0.03)', padding: isMobile ? '20px' : '30px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#FFCC00', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>3. Dati Pilota 1 (Richiedente)</h3>
                <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Nome</label>
                        <input type="text" name="nome" required placeholder="Nome" value={formData.nome} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Cognome</label>
                        <input type="text" name="cognome" required placeholder="Cognome" value={formData.cognome} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>
                <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Email</label>
                        <input type="email" name="email" required placeholder="email@esempio.com" value={formData.email} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Telefono</label>
                        <input type="tel" name="telefono" required placeholder="333 1234567" value={formData.telefono} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                    </div>
                </div>

                <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Codice Fiscale</label>
                        <input type="text" name="codice_fiscale" required placeholder="RSSMRA80A01H501U" value={formData.codice_fiscale} onChange={handleChange} style={{ ...inputStyle, textTransform: 'uppercase', fontSize: isMobile ? '1.1rem' : '1rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Comune di Nascita</label>
                        <input type="text" name="citta_nascita" required placeholder="es. Treviso" value={formData.citta_nascita} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '15px' }}>Residenza</h4>
                    <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                        <div style={{ flex: 1.5 }}>
                            <label style={labelStyle}>Via / Piazza</label>
                            <input type="text" name="via_residenza" required placeholder="es. Via Roma" value={formData.via_residenza} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                        </div>
                        <div style={{ flex: 0.5 }}>
                            <label style={labelStyle}>Civico</label>
                            <input type="text" name="civico_residenza" required placeholder="12" value={formData.civico_residenza} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                        </div>
                    </div>
                    <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>CAP</label>
                            <input type="text" name="cap_residenza" required placeholder="31100" value={formData.cap_residenza} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Città</label>
                            <input type="text" name="citta_residenza" required placeholder="Treviso" value={formData.citta_residenza} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '15px' }}>Dati Secondo Pilota (Se presente)</h4>
                    <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Nome 2</label>
                            <input type="text" name="secondo_nome" placeholder="Nome partner" value={formData.secondo_nome} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Cognome 2</label>
                            <input type="text" name="secondo_cognome" placeholder="Cognome partner" value={formData.secondo_cognome} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Cellulare 2</label>
                        <input type="tel" name="secondo_cellulare" placeholder="333 1234567" value={formData.secondo_cellulare} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                    </div>
                </div>
            </div>

            <div className="form-section-react" style={{ background: 'rgba(255,255,255,0.03)', padding: isMobile ? '20px' : '30px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#FFCC00', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>4. Alimentazione & Emergenza</h3>
                <div>
                    <label style={labelStyle}>Preferenze alimentari o allergie (Obbligatorio)</label>
                    <textarea name="food_preferences" required placeholder="Nessuna o specifica allergie..." value={formData.food_preferences} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px' }} />
                </div>
                <div style={{ ...rowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Cellulare Emergenza</label>
                        <input type="tel" name="emergency_contact_phone" required placeholder="333 1234567" value={formData.emergency_contact_phone} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Grado Parentela / Nome</label>
                        <input type="text" name="emergency_contact_info" required placeholder="es. Moglie, Mario Rossi" value={formData.emergency_contact_info} onChange={handleChange} style={{ ...inputStyle, fontSize: isMobile ? '1.1rem' : '1rem' }} />
                    </div>
                </div>

                <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px dashed #444' }}>
                    <label style={{ ...labelStyle, color: '#FFCC00' }}>Ospiti solo pranzo (€ 15 cad.)</label>
                    {lunchGuests.map((g, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="text" placeholder={`Nome Ospite ${i + 1}`} value={g}
                                onChange={(e) => updateLunchGuest(i, e.target.value)}
                                style={inputStyle} required
                            />
                            <button type="button" onClick={() => removeLunchGuest(i)} style={{ background: 'rgba(230,0,126,0.2)', border: '1px solid #E6007E', color: '#E6007E', borderRadius: '8px', padding: '0 15px', cursor: 'pointer' }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addLunchGuest} style={{ marginTop: '5px', background: 'none', border: '2px dashed #FFCC00', color: '#FFCC00', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>
                        + AGGIUNGI OSPITE PRANZO
                    </button>
                </div>
            </div>

            <div className="form-section-react" style={{ background: 'rgba(255,255,255,0.03)', padding: isMobile ? '20px' : '30px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#FFCC00', marginTop: 0, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>5. Conferme & Privacy</h3>

                {[
                    { id: 'is_mcps_member', label: 'Dichiaro di essere regolarmente iscritto al Moto Club PS (MCPS) per l\'anno 2026' },
                    { id: 'is_fango_tours_member', label: 'Sei già tesserato con l\'associazione Fango Tours?' },
                    { id: 'request_fango_tours_membership', label: 'Dichiaro di volermi tesserare a Fango Tours (importo compreso nell\'iscrizione)' },
                    { id: 'accept_fango_insurance', label: 'Dichiaro di aver letto le condizioni della polizza assicurativa Fango Tours' },
                    { id: 'authorize_pilot_profile', label: 'Autorizzi a pubblicare nel sito la tua foto e un breve CV motociclistico?' },
                    { id: 'accept_regulation', label: 'Dichiaro di aver letto e compreso integralmente il regolamento del Renga Treffen' }
                ].map(q => (
                    <div key={q.id} style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ ...labelStyle, fontSize: '0.8rem', color: '#fff', marginBottom: '10px' }}>{q.label}</label>
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name={q.id} value="SI" checked={formData[q.id] === 'SI'} onChange={handleChange} required style={{ accentColor: '#FFCC00' }} />
                                <span>SI</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name={q.id} value="NO" checked={formData[q.id] === 'NO'} onChange={handleChange} required style={{ accentColor: '#E6007E' }} />
                                <span>NO</span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <div className="total-box" style={{
                background: 'rgba(230,0,126,0.1)', border: '2px solid #E6007E', padding: '30px', borderRadius: '20px',
                textAlign: 'center', marginBottom: '30px'
            }}>
                <div style={{ color: '#E6007E', fontWeight: '900', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px' }}>Totale da Versare (Bonifico):</div>
                <div style={{ fontSize: '3rem', fontWeight: '950', color: '#E6007E' }}>€ {currentTotal},00</div>
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%', padding: '25px', backgroundColor: loading ? '#333' : '#FFCC00',
                    color: '#000', border: 'none', borderRadius: '15px', fontSize: '1.4rem',
                    fontWeight: '950', cursor: loading ? 'wait' : 'pointer', transition: '0.3s',
                    boxShadow: '0 20px 60px rgba(255,204,0,0.2)',
                    display: isMobile ? 'none' : 'block'
                }}
            >
                {loading ? 'INVIO IN CORSO...' : 'INVIA ISCRIZIONE'}
            </button>

            {/* 📍 STICKY MOBILE FOOTER */}
            {isMobile && (
                <div
                    data-dna="9002-MOBILE-STICKY-FOOTER"
                    style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        backgroundColor: '#111', borderTop: '2px solid #E6007E',
                        padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        zIndex: 1000, boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
                    }}
                >
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ color: '#E6007E', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Totale:</div>
                        <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 950 }}>€ {currentTotal},00</div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? '#444' : '#E6007E',
                            color: '#fff', border: 'none', borderRadius: '10px',
                            padding: '12px 25px', fontSize: '1rem', fontWeight: 950,
                            boxShadow: '0 4px 15px rgba(230,0,126,0.3)'
                        }}
                    >
                        {loading ? '...' : 'INVIA'}
                    </button>
                </div>
            )}
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
