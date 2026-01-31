import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RadarTab() {
    const [logs, setLogs] = useState([]);
    const [tracking, setTracking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markers = useRef({});

    useEffect(() => {
        fetchInitialData();
        const logsSub = supabase
            .channel('radar-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'race_logs' }, payload => {
                fetchInitialData(); // Refresh on new log
            })
            .subscribe();

        const trackSub = supabase
            .channel('radar-tracking')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_tracking' }, payload => {
                fetchInitialData(); // Refresh on tracking update
            })
            .subscribe();

        const interval = setInterval(fetchInitialData, 30000); // Polling di sicurezza

        return () => {
            supabase.removeChannel(logsSub);
            supabase.removeChannel(trackSub);
            clearInterval(interval);
        };
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch logs with team info
            const { data: logData } = await supabase
                .from('race_logs')
                .select(`
                    *,
                    registrations (
                        team_name,
                        bib_number,
                        card_color
                    )
                `)
                .order('recorded_at', { ascending: false })
                .limit(50);

            // Fetch tracking with team info
            const { data: trackData } = await supabase
                .from('live_tracking')
                .select(`
                    *,
                    registrations (
                        team_name,
                        bib_number,
                        card_color
                    )
                `);

            if (logData) setLogs(logData);
            if (trackData) setTracking(trackData);
        } catch (err) {
            console.error("Radar Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Inizializzazione Mappa
    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        leafletMap.current = L.map(mapRef.current).setView([45.92, 13.12], 12); // Area Talmassons-Udine

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(leafletMap.current);
    }, [mapRef]);

    // Aggiornamento Marker
    useEffect(() => {
        if (!leafletMap.current || !tracking.length) return;

        tracking.forEach(item => {
            const team = item.registrations;
            const color = team.card_color === 'ROSSA' ? '#ff4444' : (team.card_color === 'GIALLA' ? '#FFCC00' : '#E6007E');

            if (markers.current[item.registration_id]) {
                markers.current[item.registration_id].setLatLng([item.gps_lat, item.gps_lng]);
            } else {
                const marker = L.circleMarker([item.gps_lat, item.gps_lng], {
                    radius: 8,
                    fillColor: color,
                    color: '#000',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(leafletMap.current);

                marker.bindPopup(`<b>${team.bib_number} - ${team.team_name}</b><br>Ultimo segnale: ${new Date(item.last_seen).toLocaleTimeString()}`);
                markers.current[item.registration_id] = marker;
            }
        });
    }, [tracking]);

    const containerStyle = {
        padding: '30px',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '30px',
        height: 'calc(100vh - 120px)',
        color: '#fff'
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
    };

    const logItemStyle = {
        padding: '15px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        cursor: 'pointer',
        transition: '0.2s'
    };

    return (
        <div style={containerStyle}>
            {/* MAPPA CENTRALE */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>🛰️ AMBROGIO RADAR <span style={{ color: '#FFCC00' }}>LIVE Tracking</span></h2>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{tracking.length} Team tracciati</div>
                </div>
                <div ref={mapRef} style={{ flex: 1, borderRadius: '15px', background: '#000' }}></div>
            </div>

            {/* STREAM FOTO & LOGS */}
            <div style={cardStyle}>
                <h2 style={{ margin: '0 0 20px 0', fontWeight: 900, fontSize: '1.2rem' }}>📸 PHOTO STREAM</h2>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {logs.map(log => {
                        const team = log.registrations;
                        const badgeColor = team.card_color === 'ROSSA' ? '#ff4444' : (team.card_color === 'GIALLA' ? '#FFCC00' : '#E6007E');

                        return (
                            <div key={log.id} style={logItemStyle} onClick={() => setSelectedPhoto(log)}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '10px',
                                    background: log.photo_url ? `url(${log.photo_url}) center/cover` : '#222',
                                    border: `2px solid ${badgeColor}`
                                }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900 }}>Team {team.bib_number}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{team.team_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#FFCC00', marginTop: '4px' }}>FOTO {log.photo_number}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#555' }}>
                                        {new Date(log.recorded_at).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODALE VALIDAZIONE FOTO */}
            {selectedPhoto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 99999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
                }} onClick={() => setSelectedPhoto(null)}>
                    <div style={{
                        background: '#111', padding: '20px', borderRadius: '30px',
                        maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Team {selectedPhoto.registrations.bib_number} - {selectedPhoto.registrations.team_name}</h3>
                                <p style={{ color: '#FFCC00', margin: 0 }}>Validazione Foto #{selectedPhoto.photo_number}</p>
                            </div>
                            <button onClick={() => setSelectedPhoto(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {selectedPhoto.photo_url ? (
                            <img src={selectedPhoto.photo_url} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '15px', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>Nessuna immagine allegata</div>
                        )}

                        <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1, color: '#888', fontSize: '0.8rem' }}>
                                📍 GPS: {selectedPhoto.gps_lat}, {selectedPhoto.gps_lng}<br />
                                ⏰ Ora Scatto: {new Date(selectedPhoto.client_timestamp || selectedPhoto.recorded_at).toLocaleTimeString('it-IT')}
                            </div>
                            <button style={{
                                padding: '15px 30px', borderRadius: '50px', border: 'none',
                                background: '#4CAF50', color: '#fff', fontWeight: 900, cursor: 'pointer'
                            }} onClick={() => setSelectedPhoto(null)}>✅ VALIDA</button>
                            <button style={{
                                padding: '15px 30px', borderRadius: '50px', border: 'none',
                                background: '#ff4444', color: '#fff', fontWeight: 900, cursor: 'pointer'
                            }} onClick={() => setSelectedPhoto(null)}>❌ RIFIUTA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
