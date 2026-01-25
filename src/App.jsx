/**
 * 🧬 PAGE: Admin Dashboard (Main Entry)
 * Goal: Orchestrate Admin UI with Atomic Components (DEV ACCESS)
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
        <div style={{ backgroundColor: '#111116', minHeight: '100vh', color: '#fff', fontFamily: '"Inter", sans-serif', padding: '20px' }}>
            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 300, letterSpacing: '2px' }}>
                        RENGA <span style={{ color: '#FFCC00', fontWeight: 900 }}>DASHBOARD</span> 2026
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={fetchAllData} style={btnGhostStyle}>{loading ? '...' : '🔄 REFRESH'}</button>
                    <div onClick={() => setIsDevMode(!isDevMode)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: isDevMode ? 1 : 0.5 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#FFCC00' }}>DNA MODE</span>
                    </div>
                </div>
            </header>

            {!selectedItem ? (
                <>
                    {/* TABS */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '30px', backgroundColor: '#1a1a23', padding: '5px', borderRadius: '12px', width: 'fit-content' }}>
                        <button
                            onClick={() => setActiveTab('registrations')}
                            style={tabStyle(activeTab === 'registrations')}
                        >
                            ISCRIZIONI ({registrations.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            style={tabStyle(activeTab === 'messages')}
                        >
                            MESSAGGI ({messages.length})
                        </button>
                    </div>

                    {/* TABLE WORKSPACE */}
                    <div className="reveal active">
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
                </>
            ) : (
                <>
                    <button
                        onClick={() => setSelectedItem(null)}
                        style={{ marginBottom: '20px', backgroundColor: '#FFCC00', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' }}
                    >
                        ← TORNA ALLA LISTA
                    </button>
                    <CRMDetail
                        item={selectedItem.data}
                        type={selectedItem.type}
                        onBack={() => setSelectedItem(null)}
                        onRefresh={fetchAllData}
                    />
                </>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .reveal { animation: fadeIn 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}

const btnGhostStyle = { background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' };
const tabStyle = (active) => ({
    padding: '10px 20px',
    backgroundColor: active ? '#FFCC00' : 'transparent',
    color: active ? '#000' : '#888',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: '0.8rem',
    transition: '0.3s'
});

export default App;
