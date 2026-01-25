/**
 * 🧬 PAGE: Admin Dashboard v3.0
 * Goal: Premium Design, High Readability, High Contrast
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

    useEffect(() => {
        fetchAllData();
    }, []);

    async function fetchAllData() {
        setLoading(true);
        try {
            const { data: regData } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
            setRegistrations(regData || []);

            const { data: msgData } = await supabase.from('messages').select('*').neq('status', 'Archiviato').order('created_at', { ascending: false });
            setMessages(msgData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', color: '#1a1a1b', fontFamily: '"Outfit", sans-serif' }}>
            {/* HEADER PREMIUM */}
            <header style={{ backgroundColor: '#0d0d12', padding: '25px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontWeight: 300, letterSpacing: '3px' }}>
                        RENGATREFFEN <span style={{ color: '#FFCC00', fontWeight: 900 }}>DASHBOARD</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={fetchAllData} style={btnGhostStyle}>{loading ? '...' : '🔄 SYNC DATA'}</button>
                    <div onClick={() => setIsDevMode(!isDevMode)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: isDevMode ? 1 : 0.5 }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFCC00' }}></div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#FFCC00' }}>DEV MODE</span>
                    </div>
                </div>
            </header>

            <main style={{ padding: '40px' }}>
                {!selectedItem ? (
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        {/* TABS SELECTOR */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
                            <button onClick={() => setActiveTab('registrations')} style={mainTabStyle(activeTab === 'registrations')}>
                                🏁 ISCRIZIONI <span style={badgeStyle}>{registrations.length}</span>
                            </button>
                            <button onClick={() => setActiveTab('messages')} style={mainTabStyle(activeTab === 'messages')}>
                                ✉️ MESSAGGI <span style={badgeStyle}>{messages.length}</span>
                            </button>
                        </div>

                        {/* TABLE CONTAINER */}
                        <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' }}>
                            {activeTab === 'registrations' ? (
                                <RegistrationList
                                    data={registrations}
                                    onSelect={(reg) => setSelectedItem({ data: reg, type: 'registration' })}
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
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;900&family=Inter:wght@400;700&display=swap');
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

const btnGhostStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' };
const btnBackStyle = { marginBottom: '30px', backgroundColor: '#0d0d12', color: '#FFCC00', border: 'none', padding: '15px 30px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' };
const mainTabStyle = (active) => ({
    padding: '18px 35px',
    backgroundColor: active ? '#FFCC00' : '#fff',
    color: active ? '#000' : '#888',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: active ? '0 10px 20px rgba(255,204,0,0.3)' : '0 4px 10px rgba(0,0,0,0.02)',
    transition: '0.3s'
});
const badgeStyle = { backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 10px', borderRadius: '100px', fontSize: '0.7rem' };

export default App;
