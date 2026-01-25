/**
 * 🧬 PAGE: Admin Dashboard v3.1 (High Contrast Edition)
 * Goal: Maximum Readability, Dark Premium Background, Big Elements
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
        const params = new URLSearchParams(window.location.search);
        if (params.get('dev') === 'true') {
            setIsDevMode(true);
        }
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
        <div style={{ backgroundColor: '#09090b', minHeight: '100vh', color: '#fff', fontFamily: '"Inter", sans-serif' }}>

            {/* HEADER ULTRA DARK */}
            <header style={{ backgroundColor: '#000', padding: '30px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '4px', color: '#fff' }}>
                        RENGATREFFEN <span style={{ color: '#FFCC00' }}>CMS</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                    <button onClick={fetchAllData} style={btnGhostStyle}>{loading ? '...' : '🔄 SYNC SYSTEM'}</button>
                    <div onClick={() => setIsDevMode(!isDevMode)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: isDevMode ? 1 : 0.4 }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#E6007E' }}></div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#E6007E' }}>DNA</span>
                    </div>
                </div>
            </header>

            <main style={{ padding: '60px' }}>
                {!selectedItem ? (
                    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                        {/* MAIN TABS BIG */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '60px' }}>
                            <button onClick={() => setActiveTab('registrations')} style={mainTabStyle(activeTab === 'registrations')}>
                                ISCRIZIONI ({registrations.length})
                            </button>
                            <button onClick={() => setActiveTab('messages')} style={mainTabStyle(activeTab === 'messages')}>
                                MESSAGGI ({messages.length})
                            </button>
                        </div>

                        {/* TABLE WRAPPER DARK */}
                        <div style={{ backgroundColor: '#111', borderRadius: '40px', padding: '30px', border: '1px solid #333', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
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

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Custom table row styling for high contrast */
                tr:hover { background-color: #1a1a1a !important; }
                td { color: #ccc !important; font-size: 1.1rem !important; }
            `}</style>
        </div>
    );
}

const btnGhostStyle = { background: '#1a1a1f', border: '1px solid #333', color: '#fff', padding: '12px 25px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' };
const btnBackStyle = { marginBottom: '40px', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px rgba(255,204,0,0.3)' };
const mainTabStyle = (active) => ({
    padding: '25px 50px',
    backgroundColor: active ? '#FFCC00' : '#1a1a1f',
    color: active ? '#000' : '#888',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: '1.2rem',
    transition: '0.3s',
    boxShadow: active ? '0 20px 40px rgba(255,204,0,0.2)' : 'none'
});

export default App;
