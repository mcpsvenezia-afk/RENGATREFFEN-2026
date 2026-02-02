/**
 * 🧬 PAGINA: Admin Dashboard v3.1 (Edizione Alto Contrasto)
 * Obiettivo: Massima leggibilità, Sfondo Dark Premium, Elementi grandi
 */

import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { RegistrationList } from './components/comp-registration-list';
import { MessageList } from './components/comp-message-list';
import { CRMDetail } from './components/comp-crm-panel';
import { SettingsTab } from './components/comp-admin-settings';
import { AppConfigTab } from './components/comp-admin-app-config';
import { RankingsTab } from './components/comp-admin-rankings';
import { RadarTab } from './components/comp-admin-radar';
import { AdminGatekeeper } from './components/comp-admin-gatekeeper';

function App() {
    const [registrations, setRegistrations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('registrations');
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDevMode, setIsDevMode] = useState(false);

    // Filters & Sorting v7.2.7
    const [filterFormula, setFilterFormula] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PAID, NOT_PAID, WAITING, REJECTED, VERIFY
    const [sortType, setSortType] = useState('BIB'); // DEFAULT, TIME, BIB, TEAM, COGNOME, STAFF, LUNCH
    const [showPDFPreview, setShowPDFPreview] = useState(false);
    const [previewType, setPreviewType] = useState('FULL'); // FULL, ONLY_4X4, ONLY_PAID, TOTALS
    const [printOrientation, setPrintOrientation] = useState('PORTRAIT'); // PORTRAIT, LANDSCAPE
    const [printMode, setPrintMode] = useState('COLOR'); // COLOR, BW
    const [showDna, setShowDna] = useState(true);

    useEffect(() => {
        const isStored = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';
        const dnaStored = localStorage.getItem('RENGATREFFEN_SHOW_DNA') !== 'false';
        setIsDevMode(isStored);
        setShowDna(dnaStored);

        // Check URL for view mode
        const params = new URLSearchParams(window.location.search);
        const viewMode = params.get('view');

        if (viewMode === 'radar-fullscreen') {
            setActiveTab('radar-fullscreen');
        } else if (viewMode === 'radar') {
            setActiveTab('radar');
        }

        fetchAllData();
    }, []);

    // Filtered & Sorted Registrations
    const getProcessedRegistrations = () => {
        let list = [...registrations];

        // 1. Formula Filter
        if (filterFormula !== 'ALL') {
            if (filterFormula === 'CACCIA_ALL') {
                list = list.filter(r => (r.formula_partecipazione || '').startsWith('Caccia'));
            } else {
                list = list.filter(r => r.formula_partecipazione === filterFormula);
            }
        }

        // 2. Status/Paid Filter
        if (filterStatus !== 'ALL') {
            if (filterStatus === 'PAID') list = list.filter(r => r.is_paid === 'SI');
            else if (filterStatus === 'NOT_PAID') list = list.filter(r => r.is_paid !== 'SI');
            else if (filterStatus === 'WAITING') list = list.filter(r => r.stato_iscrizione === 'Lista_Attesa');
            else if (filterStatus === 'REJECTED') list = list.filter(r => r.stato_iscrizione === 'Rifiutata');
            else if (filterStatus === 'VERIFY') list = list.filter(r => r.stato_iscrizione === 'Verifica_In_Corso');
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
                    return (a.bib_number || '').localeCompare(b.bib_number || '', undefined, { numeric: true, sensitivity: 'base' });
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
        const result = await Swal.fire({
            title: 'ASSEGNAZIONE AUTOMATICA',
            text: 'Questo assegnerà pettorali e orari a TUTTI gli iscritti PAGATI (o status VERIFICA), sovrascrivendo i dati esistenti. Continuare?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#E6007E',
            cancelButtonColor: '#333',
            confirmButtonText: 'SÌ, PROCEDI',
            background: '#111',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            // Fetch relevant registrations
            const { data: validRegs, error } = await supabase
                .from('registrations')
                .select('*')
                .or('is_paid.eq.SI,stato_iscrizione.eq.Verifica_In_Corso')
                .order('created_at', { ascending: true }); // First come, first served

            if (error) throw error;
            if (!validRegs || validRegs.length === 0) {
                throw new Error("Nessuna iscrizione valida trovata.");
            }

            // Group by Team Name
            const teamGroups = {};
            validRegs.forEach(r => {
                const teamKey = r.team_name ? r.team_name.trim().toUpperCase() : `SINGLE_${r.id}`;
                if (!teamGroups[teamKey]) teamGroups[teamKey] = [];
                teamGroups[teamKey].push(r);
            });

            // Assign Loop
            let currentBib = 1;

            const updates = [];
            const groups = Object.values(teamGroups);

            for (const group of groups) {

                group.forEach((member, index) => {
                    const suffix = group.length > 1 ? String.fromCharCode(65 + index) : ''; // A, B, C...
                    const bibNumber = `${currentBib}${suffix}`;

                    updates.push({
                        id: member.id,
                        bib_number: bibNumber
                    });
                });

                currentBib++;
            }

            // Execute Updates
            for (const update of updates) {
                await supabase.from('registrations').update({
                    bib_number: update.bib_number
                }).eq('id', update.id);
            }

            await Swal.fire({
                title: 'SUCCESSO',
                text: `Assegnati ${updates.length} pettorali.`,
                icon: 'success',
                background: '#111',
                color: '#fff',
                confirmButtonColor: '#E6007E'
            });
            fetchAllData();

        } catch (err) {
            console.error(err);
            await Swal.fire({
                title: 'ERRORE',
                text: err.message,
                icon: 'error',
                background: '#111',
                color: '#fff'
            });
        } finally {
            setLoading(false);
        }
    };

    const getPreviewData = () => {
        return getProcessedRegistrations();
    };

    const getTeamColor = (name) => {
        if (!name || name.toLowerCase() === 'staff') return '#E0F7FA'; // Light Cyan for staff
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return `hsla(${h}, 60%, 90%, 1)`; // Very light color for PDF
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

    const toggleDna = () => {
        const newState = !showDna;
        localStorage.setItem('RENGATREFFEN_SHOW_DNA', newState ? 'true' : 'false');
        setShowDna(newState);
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
        const result = await Swal.fire({
            title: 'SEI SICURO?',
            text: "Questa azione eliminerà definitivamente il partecipante, tutte le sue foto e i dati di tracking!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#E6007E',
            cancelButtonColor: '#333',
            confirmButtonText: 'SÌ, ELIMINA',
            cancelButtonText: 'ANNULLA',
            background: '#111',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            // 1. Pulizia dei log di debug (Importante per evitare FK Conflict)
            const { error: debugError } = await supabase
                .from('tracking_debug_logs')
                .delete()
                .eq('registration_id', id);

            if (debugError) {
                console.error("Errore pulizia debug logs:", debugError);
                // Non lanciamo errore qui perché se l'utente ha già fatto girare la migrazione SQL CASCADE, 
                // questo step potrebbe non essere strettamente necessario o fallire per RLS ma il CASCADE farebbe il lavoro.
            }

            // 2. Eliminazione della registrazione (Gli altri hanno cascade)
            const { error } = await supabase.from('registrations').delete().eq('id', id);

            if (error) {
                if (error.code === '23503') {
                    throw new Error("Conflitto Database: Esistono ancora log o sessioni attive. Esegui la migrazione SQL 015 per risolvere definitivamente.");
                }
                throw error;
            }

            setRegistrations(prev => prev.filter(r => r.id !== id));

            Swal.fire({
                title: 'ELIMINATO',
                text: 'Partecipante rimosso con successo.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#111',
                color: '#fff'
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'ERRORE',
                text: 'Errore durante l\'eliminazione: ' + err.message,
                icon: 'error',
                background: '#111',
                color: '#fff',
                confirmButtonColor: '#E6007E'
            });
        } finally {
            setLoading(false);
        }
    }

    // 🚀 FULLSCREEN RADAR MODE CHECK
    if (activeTab === 'radar-fullscreen') {
        return (
            <AdminGatekeeper isDevMode={isDevMode}>
                <RadarTab isFullscreen={true} />
            </AdminGatekeeper>
        );
    }

    return (
        <AdminGatekeeper isDevMode={isDevMode}>
            <div data-component="DashboardApp" data-dna="1000-DASHBOARD-ROOT" style={{ minHeight: '100vh', backgroundColor: '#0c0c0e', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
                {/* TOP BAR COMPACT */}
                <div data-dna="1001-ADMIN-BAR" style={{ padding: '15px 30px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0c0c0e', position: 'sticky', top: 0, zIndex: 100 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
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

                        {isDevMode && (
                            <div
                                onClick={toggleDna}
                                data-dna="DASHBOARD-DNA-TOGGLE"
                                style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', background: showDna ? 'rgba(0,229,255,0.1)' : '#111', padding: '10px 25px', borderRadius: '100px', border: `1px solid ${showDna ? '#00E5FF' : '#333'}`, transition: '0.3s' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: showDna ? '#00E5FF' : '#444', boxShadow: showDna ? '0 0 15px #00E5FF' : 'none' }}></div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: showDna ? '#00E5FF' : '#666' }}>{showDna ? 'DNA VISIBILE' : 'DNA NASCOSTO'}</span>
                            </div>
                        )}
                        <button onClick={fetchAllData} style={btnGhostStyle}>{loading ? '...' : '🔄 SINCRONIZZA SISTEMA'}</button>
                        <button onClick={() => supabase.auth.signOut()} style={{ ...btnGhostStyle, borderColor: 'rgba(230,0,126,0.3)', color: '#E6007E' }}>❌ ESCI</button>
                    </div>
                </div>

                <main style={{ padding: '60px' }}>
                    {!selectedItem ? (
                        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                            {/* 📊 SUMMARY CARDS */}
                            <div data-dna="1150-SUMMARY-STATS" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    { label: 'TOTALE ISCRITTI', value: stats.total, color: '#fff' },
                                    { label: 'PAGATI', value: stats.paid, color: '#4CAF50' },
                                    { label: 'OSPITI PRANZO', value: stats.lunchGuests, color: '#00E5FF' },
                                    { label: 'MOTO (MCPS)', value: stats.mcps, color: '#FFCC00' },
                                    { label: 'MOTO (NON MCPS)', value: stats.nonMcps, color: '#FFAB00' },
                                    { label: 'DISCOVERY', value: stats.discovery, color: '#FF9100' },
                                    { label: '4x4', value: stats.x4, color: '#FF6D00' }
                                ].map(s => (
                                    <div key={s.label} style={{ background: '#111', padding: '10px', borderRadius: '12px', border: '1px solid #222', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#666', marginBottom: '5px' }}>{s.label}</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* MAIN TABS COMPACT */}
                            <div data-dna="1100-SECTION-NAV" style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
                                <button data-dna="1101-TAB-REGISTRATIONS" onClick={() => setActiveTab('registrations')} style={{ ...mainTabStyle(activeTab === 'registrations', 'registrations'), flex: 1, minWidth: '120px' }}>
                                    ISCRIZIONI ({registrations.length})
                                </button>
                                <button data-dna="1102-TAB-MESSAGES" onClick={() => setActiveTab('messages')} style={{ ...mainTabStyle(activeTab === 'messages', 'messages'), flex: 1, minWidth: '120px' }}>
                                    MESSAGGI ({messages.length})
                                </button>
                                <button data-dna="1103-TAB-RANKINGS" onClick={() => setActiveTab('rankings')} style={{ ...mainTabStyle(activeTab === 'rankings', 'rankings'), flex: 1, minWidth: '120px' }}>
                                    CLASSIFICHE 🏆
                                </button>
                                <button
                                    data-dna="1105-TAB-RADAR"
                                    onClick={() => {
                                        // Open in new tab with fullscreen mode
                                        window.open(window.location.pathname + '?view=radar-fullscreen', '_blank');
                                    }}
                                    style={{ ...mainTabStyle(activeTab === 'radar', 'radar'), backgroundColor: activeTab === 'radar' ? '#00FFFF' : '#111', color: activeTab === 'radar' ? '#000' : '#fff', flex: 1, minWidth: '120px' }}
                                >
                                    RADAR 🛰️ {activeTab !== 'radar' && '↗'}
                                </button>
                                <button data-dna="1104-TAB-SETTINGS" onClick={() => setActiveTab('settings')} style={{ ...mainTabStyle(activeTab === 'settings', 'settings'), flex: 1, minWidth: '120px' }}>
                                    IMPOSTAZIONI ⚙️
                                </button>
                                <button data-dna="1106-TAB-APP" onClick={() => setActiveTab('app_config')} style={{ ...mainTabStyle(activeTab === 'app_config', 'app_config'), flex: 1, minWidth: '120px' }}>
                                    APP 📱
                                </button>
                            </div>

                            {/* 🔍 FILTER BAR */}
                            {activeTab === 'registrations' && (
                                <div data-dna="1190-FILTER-BAR" style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center', background: '#111', padding: '20px 40px', borderRadius: '20px', border: '1px solid #333' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888' }}>FORMULA:</span>
                                        <select value={filterFormula} onChange={e => setFilterFormula(e.target.value)} style={selectFilterStyle}>
                                            <option value="ALL">TUTTE</option>
                                            <option value="CACCIA_ALL">CACCIA TUTTI</option>
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
                                            <option value="WAITING">SOLO LISTA ATTESA</option>
                                            <option value="REJECTED">SOLO RIFIUTATI</option>
                                            <option value="VERIFY">IN VERIFICA</option>
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
                                        🚀 ASSEGNA PETTORALI
                                    </button>
                                    <div style={{ width: '20px' }}></div>
                                    <button
                                        onClick={() => setShowPDFPreview(true)}
                                        style={{ ...filterBtnStyle, backgroundColor: '#4CAF50', border: 'none', color: '#000' }}
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
                                ) : activeTab === 'messages' ? (
                                    <MessageList
                                        data={messages}
                                        onSelect={(msg) => setSelectedItem({ data: msg, type: 'message' })}
                                        isDevMode={isDevMode}
                                        onInspect={(msg) => navigator.clipboard.writeText(JSON.stringify(msg, null, 2))}
                                    />
                                ) : activeTab === 'rankings' ? (
                                    <RankingsTab
                                        registrations={registrations}
                                        onRefresh={fetchAllData}
                                    />
                                ) : activeTab === 'radar' ? (
                                    <RadarTab />
                                ) : activeTab === 'app_config' ? (
                                    <AppConfigTab
                                        isDevMode={isDevMode}
                                        onRefresh={fetchAllData}
                                    />
                                ) : (
                                    <SettingsTab
                                        isDevMode={isDevMode}
                                        onRefresh={fetchAllData}
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
                            <h2 className="no-print" style={{ color: '#FFCC00', margin: 0 }}>ANTEPRIMA REPORT PDF</h2>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <select
                                    value={printOrientation}
                                    onChange={(e) => setPrintOrientation(e.target.value)}
                                    style={{ ...selectFilterStyle, padding: '10px 30px' }}
                                >
                                    <option value="PORTRAIT">VERTICALE</option>
                                    <option value="LANDSCAPE">ORIZZONTALE</option>
                                </select>

                                <select
                                    value={printMode}
                                    onChange={(e) => setPrintMode(e.target.value)}
                                    style={{ ...selectFilterStyle, padding: '10px 30px' }}
                                >
                                    <option value="COLOR">A COLORI</option>
                                    <option value="BW">BIANCO E NERO</option>
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
                                <p>Data Generazione: {new Date().toLocaleString()}</p>
                            </div>

                            {activeTab === 'rankings' ? (
                                <table className="pdf-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', width: '60px', color: '#000', fontWeight: 'bold' }}>POS</th>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left', color: '#000', fontWeight: 'bold' }}>TEAM</th>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', width: '120px', color: '#000', fontWeight: 'bold' }}>PUNTEGGIO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const teams = Array.from(new Set(registrations
                                                .filter(r => r.team_name && r.team_name.toLowerCase() !== 'staff')
                                                .map(r => r.team_name)
                                            )).map(name => ({
                                                name,
                                                score: registrations.find(r => r.team_name === name)?.score_caccia || 0
                                            })).sort((a, b) => b.score - a.score);

                                            return teams.map((t, i) => (
                                                <tr key={t.name}>
                                                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>{i + 1}</td>
                                                    <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', color: '#000' }}>{t.name.toUpperCase()}</td>
                                                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#000' }}>{t.score}</td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="pdf-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#000', fontWeight: 'bold' }}>
                                                {(() => {
                                                    switch (sortType) {
                                                        case 'TIME': return 'PARTENZA';
                                                        case 'BIB': return '# GARA';
                                                        case 'TEAM': return 'TEAM';
                                                        case 'COGNOME': return 'PILOTA';
                                                        case 'STAFF': return 'STAFF';
                                                        case 'LUNCH': return 'OSPITI';
                                                        default: return '# GARA';
                                                    }
                                                })()}
                                            </th>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#000', fontWeight: 'bold' }}>TEAM / PILOTA</th>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#000', fontWeight: 'bold' }}>MOTO / VEICOLO</th>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#000', fontWeight: 'bold' }}>STATO</th>
                                            <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#000', fontWeight: 'bold' }}>FORMULA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getPreviewData().map(r => (
                                            <tr key={r.id} style={{ backgroundColor: printMode === 'COLOR' ? getTeamColor(r.team_name) : 'transparent' }}>
                                                <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', color: '#000' }}>
                                                    {(() => {
                                                        switch (sortType) {
                                                            case 'TIME': return r.departure_time || '--:--';
                                                            case 'BIB': return r.bib_number || '--';
                                                            case 'TEAM': return r.team_name;
                                                            case 'COGNOME': return r.cognome;
                                                            case 'STAFF': return r.team_name;
                                                            case 'LUNCH': return r.pranzo_accompagnatori || 0;
                                                            default: return r.bib_number || '--';
                                                        }
                                                    })()}
                                                </td>
                                                <td style={{ border: '1px solid #000', padding: '10px', color: '#000', fontWeight: 'bold' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{r.team_name}</div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{r.nome} {r.cognome}</div>
                                                </td>
                                                <td style={{ border: '1px solid #000', padding: '10px', color: '#000', fontWeight: 'bold' }}>
                                                    {r.moto_details || r.moto}
                                                </td>
                                                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '0.8rem', color: '#000', fontWeight: 'bold' }}>
                                                    {r.is_paid === 'SI' ? 'PAGATO' : 'DA PAGARE'}
                                                </td>
                                                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '0.8rem', color: '#000', fontWeight: 'bold' }}>
                                                    {r.formula_partecipazione?.replace('_', ' ')}
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
                #renga-dev-menu { position: fixed; bottom: 30px; right: 30px; z-index: 2147483646; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
                
                /* Custom table row styling for high contrast (Dashboard Only) */
                [data-dna="SECTION-TABLE"] tr:hover { background-color: #1a1a1a !important; }
                [data-dna="SECTION-TABLE"] td { color: #ccc !important; font-size: 1.1rem !important; }

                @media print {
                    @page {
                        size: ${printOrientation === 'LANDSCAPE' ? 'landscape' : 'portrait'};
                        margin: 20mm;
                    }
                    body { background: white !important; color: black !important; padding: 0 !important; }
                    [data-dna="1000-DASHBOARD-ROOT"] > *:not([data-dna="2300-PDF-PREVIEW-MODAL"]) { display: none !important; }
                    [data-dna="1001-ADMIN-BAR"], 
                    [data-dna="1100-SECTION-NAV"], 
                    [data-dna="1190-FILTER-BAR"],
                    [data-dna="1150-SUMMARY-STATS"],
                    .btn-delete, .btn-detail, .no-print, [data-dna="2300-PDF-PREVIEW-MODAL"] button, [data-dna="2300-PDF-PREVIEW-MODAL"] select { display: none !important; }

                    [data-dna="2300-PDF-PREVIEW-MODAL"] {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        padding: 0 !important;
                        display: block !important;
                        z-index: 9999 !important;
                    }
                    
                    #printable-area {
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
                    }
                    
                    #printable-area * { color: black !important; border-color: black !important; font-weight: bold !important; }
                    #printable-area table tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .pdf-table td, .pdf-table th { color: #000 !important; font-weight: bold !important; border: 1px solid #000 !important; }
                }
            `}</style>
            </div>
        </AdminGatekeeper>
    );
}

const selectFilterStyle = { background: '#222', color: '#fff', border: '1px solid #444', padding: '10px 15px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' };
const filterBtnStyle = { padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, border: '1px solid #444', transition: '0.3s', userSelect: 'none' };

const btnGhostStyle = { background: '#1a1a1f', border: '1px solid #333', color: '#fff', padding: '12px 25px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' };
const btnBackStyle = { marginBottom: '40px', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px rgba(255,204,0,0.3)' };
const mainTabStyle = (active, type) => {
    let activeColor = '#FFCC00';
    if (type === 'messages') activeColor = '#00E5FF';
    if (type === 'rankings') activeColor = '#00E5FF';
    if (type === 'settings') activeColor = '#fff';
    if (type === 'app_config') activeColor = '#00E5FF';

    let shadowColor = 'rgba(255,204,0,0.2)';
    if (type === 'messages' || type === 'rankings') shadowColor = 'rgba(0,229,255,0.2)';
    if (type === 'settings') shadowColor = 'rgba(255,255,255,0.1)';
    if (type === 'app_config') shadowColor = 'rgba(0,229,255,0.2)';

    return {
        padding: '12px 20px',
        backgroundColor: active ? activeColor : '#1a1a1f',
        color: active ? '#000' : '#888',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: '0.9rem',
        transition: '0.3s',
        boxShadow: active ? `0 10px 20px ${shadowColor}` : 'none'
    };
};

export default App;
