/**
 * 🧬 PAGINA: Admin Dashboard v3.1 (Edizione Alto Contrasto)
 * Obiettivo: Massima leggibilità, Sfondo Dark Premium, Elementi grandi
 */

import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { RegistrationList } from './components/comp-registration-list';
import { MessageList } from './components/comp-message-list';
import { CRMDetail } from './components/comp-crm-panel';

function App() {
    const [registrations, setRegistrations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('registrations');
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDevMode, setIsDevMode] = useState(false);

    // Filters & Sorting v7.2.7
    const [filterFormula, setFilterFormula] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PAID, NOT_PAID, WAITING, REJECTED
    const [sortType, setSortType] = useState('DEFAULT'); // DEFAULT, TIME, BIB, TEAM, COGNOME, STAFF, LUNCH
    const [showPDFPreview, setShowPDFPreview] = useState(false);
    const [previewType, setPreviewType] = useState('FULL'); // FULL, ONLY_4X4, ONLY_PAID, TOTALS

    useEffect(() => {
        const isStored = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';
        setIsDevMode(isStored);
        fetchAllData();
    }, []);

    // Filtered & Sorted Registrations
    const getProcessedRegistrations = () => {
        let list = [...registrations];

        // 1. Formula Filter
        if (filterFormula !== 'ALL') {
            list = list.filter(r => r.formula_partecipazione === filterFormula);
        }

        // 2. Status/Paid Filter
        if (filterStatus !== 'ALL') {
            if (filterStatus === 'PAID') list = list.filter(r => r.is_paid === 'SI');
            else if (filterStatus === 'NOT_PAID') list = list.filter(r => r.is_paid !== 'SI');
            else if (filterStatus === 'WAITING') list = list.filter(r => r.stato_iscrizione === 'Lista_Attesa');
            else if (filterStatus === 'REJECTED') list = list.filter(r => r.stato_iscrizione === 'Rifiutata');
        }

        // 3. Advanced Sorting
        list.sort((a, b) => {
            // Priority: STAFF grouping
            const isStaffA = (a.team_name || '').toLowerCase() === 'staff';
            const isStaffB = (b.team_name || '').toLowerCase() === 'staff';

            if (sortType === 'STAFF') {
                if (isStaffA && !isStaffB) return -1;
                if (!isStaffA && isStaffB) return 1;
            }

            switch (sortType) {
                case 'TIME':
                    return (a.departure_time || '99:99').localeCompare(b.departure_time || '99:99');
                case 'BIB':
                    return (parseInt(a.bib_number) || 999) - (parseInt(b.bib_number) || 999);
                case 'TEAM':
                    return (a.team_name || '').localeCompare(b.team_name || '');
                case 'COGNOME':
                    return (a.cognome || '').localeCompare(b.cognome || '');
                case 'LUNCH':
                    return (parseInt(b.pranzo_accompagnatori) || 0) - (parseInt(a.pranzo_accompagnatori) || 0);
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        return list;
    };

    const handleAutoAssign = async () => {
        if (!window.confirm("Attenzione: gli orari e i numeri di partenza verranno ricalcolati per tutti gli iscritti confermati. Procedere?")) return;

        setLoading(true);
        try {
            let currentList = [...registrations].filter(r => r.stato_iscrizione === 'Confermata');

            // Helper to group by team
            const groupByTeam = (list) => {
                const groups = {};
                list.forEach(r => {
                    const t = r.team_name || 'NO_TEAM_' + r.id;
                    if (!groups[t]) groups[t] = [];
                    groups[t].push(r);
                });
                return Object.values(groups);
            };

            // Group categories
            const x4Groups = groupByTeam(currentList.filter(r => r.formula_partecipazione === '4x4'));
            const cacciaGroups = groupByTeam(currentList.filter(r => r.formula_partecipazione?.startsWith('Caccia')));
            const discoveryGroups = groupByTeam(currentList.filter(r => r.formula_partecipazione === 'Discovery'));

            let updates = [];
            let currentBib = 1;

            const formatTime = (totalMinutes) => {
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            };

            // 1. 4x4: Starts 08:00, 1 min interval per group
            let time4x4 = 8 * 60;
            x4Groups.sort((a, b) => (a[0].team_name || '').localeCompare(b[0].team_name || '')).forEach(group => {
                const time = formatTime(time4x4);
                group.forEach(r => updates.push({ id: r.id, bib_number: currentBib, departure_time: time }));
                currentBib++;
                time4x4 += 1;
            });

            // 2. Caccia: Starts 08:30, 2 min interval per group
            let timeCaccia = 8 * 60 + 30;
            cacciaGroups.sort((a, b) => (a[0].team_name || '').localeCompare(b[0].team_name || '')).forEach(group => {
                const time = formatTime(timeCaccia);
                group.forEach(r => updates.push({ id: r.id, bib_number: currentBib, departure_time: time }));
                currentBib++;
                timeCaccia += 2;
            });

            // 3. Discovery: Starts after Caccia + 20 min break, 1 min interval per group
            let timeDiscovery = timeCaccia + 20;
            discoveryGroups.sort((a, b) => (a[0].team_name || '').localeCompare(b[0].team_name || '')).forEach(group => {
                const time = formatTime(timeDiscovery);
                group.forEach(r => updates.push({ id: r.id, bib_number: currentBib, departure_time: time }));
                currentBib++;
                timeDiscovery += 1;
            });

            // Save to DB
            for (const upd of updates) {
                await supabase.from('registrations').update({
                    bib_number: upd.bib_number,
                    departure_time: upd.departure_time
                }).eq('id', upd.id);
            }

            await fetchAllData();
            alert("Assegnazione automatica completata!");
        } catch (err) {
            console.error(err);
            alert("Errore durante l'assegnazione: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getPreviewData = () => {
        let list = getProcessedRegistrations();
        if (previewType === 'ONLY_4X4') return list.filter(r => r.formula_partecipazione === '4x4');
        if (previewType === 'ONLY_PAID') return list.filter(r => r.is_paid === 'SI');
        return list;
    };

    const stats = {
        total: registrations.length,
        mcps: registrations.filter(r => r.formula_partecipazione === 'Caccia_MCPS').length,
        nonMcps: registrations.filter(r => r.formula_partecipazione === 'Caccia_NON_MCPS').length,
        discovery: registrations.filter(r => r.formula_partecipazione === 'Discovery').length,
        x4: registrations.filter(r => r.formula_partecipazione === '4x4').length,
        paid: registrations.filter(r => r.is_paid === 'SI').length,
        lunchGuests: registrations.reduce((acc, r) => acc + (parseInt(r.pranzo_accompagnatori) || 0), 0)
    };

    const toggleDevMode = () => {
        const newState = !isDevMode;
        if (newState) {
            localStorage.setItem('RENGATREFFEN_DEV_MODE', 'true');
        } else {
            localStorage.removeItem('RENGATREFFEN_DEV_MODE');
        }
        setIsDevMode(newState);
        window.location.reload();
    };

    async function fetchAllData() {
        setLoading(true);
        try {
            const { data: regData } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
            setRegistrations(regData || []);

            const { data: msgData } = await supabase.from('messages').select('*').neq('status', 'Archiviato').order('created_at', { ascending: false });

            if (msgData && msgData.length > 0) {
                const msgIds = msgData.map(m => m.id);
                const { data: attachData } = await supabase.from('crm_attachments').select('message_id').in('message_id', msgIds);
                const idsWithAttach = new Set(attachData?.map(a => a.message_id) || []);
                msgData.forEach(m => { m.has_attachments = idsWithAttach.has(m.id); });
            }

            setMessages(msgData || []);

            if (selectedItem) {
                const refreshed = regData?.find(r => r.id === selectedItem.data.id);
                if (refreshed) {
                    setSelectedItem(prev => ({ ...prev, data: refreshed }));
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteRegistration(id) {
        setLoading(true);
        try {
            const { error } = await supabase.from('registrations').delete().eq('id', id);
            if (error) throw error;
            setRegistrations(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error deleting registration:', err);
            alert('Errore durante l\'eliminazione: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div data-component="DashboardApp" data-dna="1000-DASHBOARD-ROOT" style={{ minHeight: '100vh', backgroundColor: '#0c0c0e', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
            {/* TOP BAR PREMIUM */}
            <div data-dna="1001-ADMIN-BAR" style={{ padding: '30px 60px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0c0c0e', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '4px', color: '#fff' }}>
                        RENGATREFFEN <span style={{ color: '#FFCC00' }}>CMS</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                    <div
                        onClick={toggleDevMode}
                        data-dna="DASHBOARD-DEV-TOGGLE"
                        style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', background: isDevMode ? 'rgba(230,0,126,0.1)' : '#111', padding: '10px 25px', borderRadius: '100px', border: `1px solid ${isDevMode ? '#E6007E' : '#333'}`, transition: '0.3s' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isDevMode ? '#E6007E' : '#444', boxShadow: isDevMode ? '0 0 15px #E6007E' : 'none' }}></div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: isDevMode ? '#E6007E' : '#666' }}>MODO DEV {isDevMode ? 'ATTIVO' : 'SPENTO'}</span>
                    </div>
                    <button onClick={fetchAllData} style={btnGhostStyle}>{loading ? '...' : '🔄 SINCRONIZZA SISTEMA'}</button>
                </div>
            </div>

            <main style={{ padding: '60px' }}>
                {!selectedItem ? (
                    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                        {/* 📊 SUMMARY CARDS */}
                        <div data-dna="1150-SUMMARY-STATS" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            {[
                                { label: 'TOTALE ISCRITTI', value: stats.total, color: '#fff' },
                                { label: 'PAGATI', value: stats.paid, color: '#4CAF50' },
                                { label: 'OSPITI PRANZO', value: stats.lunchGuests, color: '#00E5FF' },
                                { label: 'MOTO (MCPS)', value: stats.mcps, color: '#FFCC00' },
                                { label: 'MOTO (NON MCPS)', value: stats.nonMcps, color: '#FFAB00' },
                                { label: 'DISCOVERY', value: stats.discovery, color: '#FF9100' },
                                { label: '4x4', value: stats.x4, color: '#FF6D00' }
                            ].map(s => (
                                <div key={s.label} style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#666', marginBottom: '10px' }}>{s.label}</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* MAIN TABS BIG */}
                        <div data-dna="1100-SECTION-NAV" style={{ display: 'flex', gap: '20px', marginBottom: '60px' }}>
                            <button data-dna="1101-TAB-REGISTRATIONS" onClick={() => setActiveTab('registrations')} style={mainTabStyle(activeTab === 'registrations', 'registrations')}>
                                ISCRIZIONI ({registrations.length})
                            </button>
                            <button data-dna="1102-TAB-MESSAGES" onClick={() => setActiveTab('messages')} style={mainTabStyle(activeTab === 'messages', 'messages')}>
                                MESSAGGI ({messages.length})
                            </button>
                        </div>

                        {/* 🔍 FILTER BAR */}
                        {activeTab === 'registrations' && (
                            <div data-dna="1190-FILTER-BAR" style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center', background: '#111', padding: '20px 40px', borderRadius: '20px', border: '1px solid #333' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888' }}>FORMULA:</span>
                                    <select value={filterFormula} onChange={e => setFilterFormula(e.target.value)} style={selectFilterStyle}>
                                        <option value="ALL">TUTTE</option>
                                        <option value="Caccia_MCPS">CACCIA MCPS</option>
                                        <option value="Caccia_NON_MCPS">CACCIA NON MCPS</option>
                                        <option value="Discovery">DISCOVERY</option>
                                        <option value="4x4">4x4</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888' }}>STATO/PAGAMENTO:</span>
                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectFilterStyle}>
                                        <option value="ALL">TUTTI</option>
                                        <option value="PAID">PAGATI</option>
                                        <option value="NOT_PAID">NON PAGATI</option>
                                        <option value="WAITING">LISTA D'ATTESA</option>
                                        <option value="REJECTED">RIFIUTATI</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888' }}>ORDINA PER:</span>
                                    <select value={sortType} onChange={e => setSortType(e.target.value)} style={selectFilterStyle}>
                                        <option value="DEFAULT">PIÙ RECENTI</option>
                                        <option value="TIME">ORARIO PARTENZA</option>
                                        <option value="BIB">NUMERO GARA</option>
                                        <option value="TEAM">NOME TEAM</option>
                                        <option value="COGNOME">COGNOME PILOTA</option>
                                        <option value="STAFF">GRUPPO STAFF</option>
                                        <option value="LUNCH">OSPITI PRANZO</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}></div>
                                <button
                                    onClick={handleAutoAssign}
                                    style={{ ...filterBtnStyle, backgroundColor: '#E6007E', border: 'none', color: '#fff' }}
                                >
                                    ⚡ AUTO-TIME
                                </button>
                                <button
                                    onClick={() => setShowPDFPreview(true)}
                                    style={{ ...filterBtnStyle, backgroundColor: '#4CAF50', border: 'none', color: '#fff' }}
                                >
                                    🖨️ ANTEPRIMA & STAMPA
                                </button>
                            </div>
                        )}

                        {/* TABLE WRAPPER DARK */}
                        <div data-dna="SECTION-TABLE" style={{ backgroundColor: '#111', borderRadius: '40px', padding: '30px', border: '1px solid #333', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
                            {activeTab === 'registrations' ? (
                                <RegistrationList
                                    data={getProcessedRegistrations()}
                                    onSelect={(reg) => setSelectedItem({ data: reg, type: 'registration' })}
                                    onDelete={handleDeleteRegistration}
                                    isDevMode={isDevMode}
                                    onInspect={(reg) => navigator.clipboard.writeText(JSON.stringify(reg, null, 2))}
                                />
                            ) : (
                                <MessageList
                                    data={messages}
                                    onSelect={(msg) => setSelectedItem({ data: msg, type: 'message' })}
                                    isDevMode={isDevMode}
                                    onInspect={(msg) => navigator.clipboard.writeText(JSON.stringify(msg, null, 2))}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                        <button
                            onClick={() => setSelectedItem(null)}
                            style={btnBackStyle}
                        >
                            ← TORNA ALLA LISTA
                        </button>
                        <CRMDetail
                            item={selectedItem.data}
                            type={selectedItem.type}
                            onBack={() => setSelectedItem(null)}
                            onRefresh={fetchAllData}
                        />
                    </div>
                )}
            </main>

            {/* 📄 PDF PREVIEW MODAL */}
            {showPDFPreview && (
                <div
                    data-dna="2300-PDF-PREVIEW-MODAL"
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2000,
                        display: 'flex', flexDirection: 'column', padding: '40px'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h2 style={{ color: '#FFCC00', margin: 0 }}>ANTEPRIMA REPORT PDF</h2>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <select
                                value={previewType}
                                onChange={(e) => setPreviewType(e.target.value)}
                                style={{ ...selectFilterStyle, padding: '10px 30px' }}
                            >
                                <option value="FULL">REPORT COMPLETO</option>
                                <option value="ONLY_4X4">SOLO 4x4</option>
                                <option value="ONLY_PAID">SOLO PAGATI</option>
                                <option value="TOTALS">RIEPILOGO TOTALI</option>
                            </select>
                            <button
                                onClick={() => { window.print(); setShowPDFPreview(false); }}
                                style={{ ...filterBtnStyle, backgroundColor: '#FFCC00', color: '#000' }}
                            >
                                🖨️ CONFERMA & STAMPA
                            </button>
                            <button
                                onClick={() => setShowPDFPreview(false)}
                                style={{ ...filterBtnStyle, backgroundColor: '#444' }}
                            >
                                CHIUDI
                            </button>
                        </div>
                    </div>

                    <div
                        id="printable-area"
                        style={{
                            backgroundColor: '#fff', color: '#000', flex: 1,
                            borderRadius: '20px', padding: '50px', overflowY: 'auto',
                            fontFamily: 'serif'
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
                            <h1 style={{ margin: 0, fontSize: '2.5rem' }}>RENGA TREFFEN 2026</h1>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>LISTA ISCRITTI - VISTA: {previewType}</p>
                            <p>Data Generazione: {new Date().toLocaleString()}</p>
                        </div>

                        {previewType === 'TOTALS' ? (
                            <div style={{ fontSize: '1.5rem', lineHeight: '2' }}>
                                <p><strong>Totale Iscritti:</strong> {stats.total}</p>
                                <p><strong>Pagati:</strong> {stats.paid}</p>
                                <p><strong>MCPS:</strong> {stats.mcps}</p>
                                <p><strong>Ospiti Pranzo:</strong> {stats.lunchGuests}</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #000', padding: '10px' }}>TEAM / PILOTA</th>
                                        <th style={{ border: '1px solid #000', padding: '10px' }}>MOTO / VEICOLO</th>
                                        <th style={{ border: '1px solid #000', padding: '10px' }}>STATO</th>
                                        <th style={{ border: '1px solid #000', padding: '10px' }}>ORARIO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getPreviewData().map(r => (
                                        <tr key={r.id}>
                                            <td style={{ border: '1px solid #000', padding: '10px' }}>
                                                {r.team_name} - {r.nome} {r.cognome}
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '10px' }}>
                                                {r.moto_details || r.moto}
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '10px' }}>
                                                {r.is_paid === 'SI' ? 'PAGATO' : 'DA PAGARE'}
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '10px' }}>
                                                {r.departure_time || '--:--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Custom table row styling for high contrast */
                tr:hover { background-color: #1a1a1a !important; }
                td { color: #ccc !important; font-size: 1.1rem !important; }

                @media print {
                    body { background: white !important; color: black !important; padding: 0 !important; }
                    [data-dna="1001-ADMIN-BAR"], 
                    [data-dna="1100-SECTION-NAV"], 
                    [data-dna="1190-FILTER-BAR"],
                    .btn-delete, .btn-detail, .no-print, [data-dna="2300-PDF-PREVIEW-MODAL"] button, [data-dna="2300-PDF-PREVIEW-MODAL"] select { display: none !important; }

                    [data-dna="2300-PDF-PREVIEW-MODAL"] {
                        position: relative !important;
                        background: white !important;
                        padding: 0 !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        display: block !important;
                    }
                    
                    [data-dna="1150-SUMMARY-STATS"] { 
                        display: grid !important; 
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 10px !important;
                        margin-bottom: 20px !important;
                        color: black !important;
                    }
                    [data-dna="1150-SUMMARY-STATS"] > div {
                        background: #eee !important;
                        border: 1px solid #ddd !important;
                        padding: 10px !important;
                        color: black !important;
                    }
                    [data-dna="1150-SUMMARY-STATS"] div { color: black !important; }

                    [data-dna="SECTION-TABLE"] {
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    table { color: black !important; border-collapse: collapse !important; width: 100% !important; }
                    th, td { border: 1px solid #eee !important; color: black !important; padding: 8px !important; font-size: 0.8rem !important; }
                    tr { background: transparent !important; }
                }
            `}</style>
        </div>
    );
}

const selectFilterStyle = { background: '#222', color: '#fff', border: '1px solid #444', padding: '10px 15px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' };
const filterBtnStyle = { padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, border: '1px solid #444', transition: '0.3s', userSelect: 'none' };

const btnGhostStyle = { background: '#1a1a1f', border: '1px solid #333', color: '#fff', padding: '12px 25px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' };
const btnBackStyle = { marginBottom: '40px', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px rgba(255,204,0,0.3)' };
const mainTabStyle = (active, type) => {
    const activeColor = type === 'messages' ? '#00E5FF' : '#FFCC00';
    const shadowColor = type === 'messages' ? 'rgba(0,229,255,0.2)' : 'rgba(255,204,0,0.2)';

    return {
        padding: '25px 50px',
        backgroundColor: active ? activeColor : '#1a1a1f',
        color: active ? '#000' : '#888',
        border: 'none',
        borderRadius: '24px',
        cursor: 'pointer',
        fontWeight: 900,
        fontSize: '1.2rem',
        transition: '0.3s',
        boxShadow: active ? `0 20px 40px ${shadowColor}` : 'none'
    };
};

export default App;
