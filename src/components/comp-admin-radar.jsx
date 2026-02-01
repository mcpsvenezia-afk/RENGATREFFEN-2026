import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RadarTab() {
    const [logs, setLogs] = useState([]);
    const [tracking, setTracking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [gpxTracks, setGpxTracks] = useState(() => {
        const saved = localStorage.getItem('RENGATREFFEN_RADAR_GPX');
        return saved ? JSON.parse(saved) : [];
    });

    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markers = useRef({});
    const polylineLayers = useRef({});

    useEffect(() => {
        localStorage.setItem('RENGATREFFEN_RADAR_GPX', JSON.stringify(gpxTracks));
        if (mapReady) renderGpxTracks();
    }, [gpxTracks, mapReady]);

    const renderGpxTracks = () => {
        if (!leafletMap.current || !window.L) return;

        // Rimuovi polilinee vecchie non più presenti
        Object.keys(polylineLayers.current).forEach(id => {
            if (!gpxTracks.find(t => t.id === id)) {
                leafletMap.current.removeLayer(polylineLayers.current[id]);
                delete polylineLayers.current[id];
            }
        });

        // Aggiungi o aggiorna tracce
        gpxTracks.forEach(track => {
            if (polylineLayers.current[track.id]) {
                polylineLayers.current[track.id].setStyle({
                    color: track.color,
                    weight: track.weight
                });
            } else {
                const layer = window.L.polyline(track.points, {
                    color: track.color,
                    weight: track.weight,
                    opacity: 0.8
                }).addTo(leafletMap.current);
                polylineLayers.current[track.id] = layer;
            }
        });
    };

    const handleGpxUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(event.target.result, 'text/xml');
            const points = Array.from(xmlDoc.querySelectorAll('trkpt')).map(pt => [
                parseFloat(pt.getAttribute('lat')),
                parseFloat(pt.getAttribute('lon'))
            ]);

            if (points.length === 0) {
                Swal.fire({
                    title: 'GPX NON VALIDO',
                    text: "File GPX non valido o senza punti traccia.",
                    icon: 'error',
                    background: '#111',
                    color: '#fff',
                    confirmButtonColor: '#E6007E'
                });
                return;
            }

            const newTrack = {
                id: `gpx_${Date.now()}`,
                name: file.name,
                points: points,
                color: '#FFCC00',
                weight: 4
            };

            setGpxTracks(prev => [...prev, newTrack]);
            if (leafletMap.current) {
                leafletMap.current.fitBounds(points);
            }

            Swal.fire({
                title: 'GPX CARICATO',
                text: `Traccia "${file.name}" importata con successo.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#111',
                color: '#fff'
            });
        };
        reader.readAsText(file);
        e.target.value = ""; // Reset
    };

    const updateTrackProp = (id, prop, value) => {
        setGpxTracks(prev => prev.map(t => t.id === id ? { ...t, [prop]: value } : t));
    };

    const removeTrack = (id) => {
        setGpxTracks(prev => prev.filter(t => t.id !== id));
    };

    const handleManualSave = () => {
        localStorage.setItem('RENGATREFFEN_RADAR_GPX', JSON.stringify(gpxTracks));
        Swal.fire({
            title: 'CONFIGURAZIONE SALVATA',
            text: "Le tracce GPX e le loro proprietà sono state salvate localmente.",
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#111',
            color: '#fff'
        });
    };

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

        const interval = setInterval(fetchInitialData, 10000); // Polling più frequente (10s)

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
                        card_color,
                        separation_seconds
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
                        card_color,
                        nome,
                        cognome,
                        secondo_nome,
                        secondo_cognome
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
        if (!mapRef.current || leafletMap.current || !window.L) return;

        leafletMap.current = window.L.map(mapRef.current).setView([45.92, 13.12], 12); // Area Talmassons-Udine

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(leafletMap.current);

        setMapReady(true);

        // Zoom out to see all tracks if present
        if (gpxTracks.length > 0) {
            const allPoints = gpxTracks.flatMap(t => t.points);
            if (allPoints.length > 0) {
                leafletMap.current.fitBounds(allPoints);
            }
        }
    }, [mapRef, window.L]);

    // Aggiornamento Marker
    useEffect(() => {
        if (!leafletMap.current || !tracking.length || !window.L) return;

        tracking.forEach(item => {
            const team = item.registrations;
            const color = team.card_color === 'ROSSA' ? '#ff4444' : (team.card_color === 'GIALLA' ? '#FFCC00' : '#E6007E');
            const markerKey = `${item.registration_id}_${item.pilot_code || 'X'}`;

            if (markers.current[markerKey]) {
                markers.current[markerKey].setLatLng([item.gps_lat, item.gps_lng]);
            } else {
                const marker = window.L.circleMarker([item.gps_lat, item.gps_lng], {
                    radius: 8,
                    fillColor: color,
                    color: '#000',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(leafletMap.current);

                const surname = item.pilot_code === 'A' ? team.cognome : team.secondo_cognome;
                marker.bindPopup(`<b>${team.team_name} - ${surname || ''}</b><br>Ultimo segnale: ${new Date(item.last_seen).toLocaleTimeString()}`);
                markers.current[markerKey] = marker;
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>🛰️ GEOPOINT <span style={{ color: '#FFCC00' }}>PRO RADAR</span></h2>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={fetchInitialData} style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid #444', padding: '6px 15px',
                            borderRadius: '10px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, color: '#fff'
                        }}>
                            🔄 REFRESH
                        </button>
                        <button onClick={handleManualSave} style={{
                            background: '#00E5FF', border: 'none', padding: '6px 15px',
                            borderRadius: '10px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, color: '#000'
                        }}>
                            💾 SALVA CONFIGURAZIONE
                        </button>
                        <label style={{
                            background: '#111', border: '1px solid #333', padding: '6px 15px',
                            borderRadius: '10px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900
                        }}>
                            📁 CARICA TRACCIA GPX
                            <input type="file" accept=".gpx" style={{ display: 'none' }} onChange={handleGpxUpload} />
                        </label>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{tracking.length} Team tracciati</div>
                    </div>
                </div>

                {/* LISTA TRACCE GPX CARICATE */}
                {gpxTracks.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '10px' }}>
                        {gpxTracks.map(track => (
                            <div key={track.id} style={{
                                background: '#111', border: '1px solid #333', padding: '8px 12px',
                                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 'fit-content'
                            }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</span>
                                <input type="color" value={track.color} onChange={e => updateTrackProp(track.id, 'color', e.target.value)} style={{ padding: 0, border: 'none', width: '20px', height: '20px', background: 'none' }} />
                                <input type="range" min="1" max="10" value={track.weight} onChange={e => updateTrackProp(track.id, 'weight', parseInt(e.target.value))} style={{ width: '50px', accentColor: '#FFCC00' }} />
                                <button onClick={() => removeTrack(track.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontWeight: 900 }}>×</button>
                            </div>
                        ))}
                    </div>
                )}
                {!window.L ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        CARICAMENTO MOTORE MAPPA...
                    </div>
                ) : (
                    <div ref={mapRef} style={{ flex: 1, borderRadius: '15px', background: '#000' }}></div>
                )}
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
                                    <div style={{ fontWeight: 900 }}>Team {team.bib_number}{log.pilot_code}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{team.team_name} - {log.pilot_code === 'A' ? team.cognome : team.secondo_cognome}</div>
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
                                <h3 style={{ margin: 0 }}>Team {selectedPhoto.registrations.bib_number}{selectedPhoto.pilot_code} - {selectedPhoto.registrations.team_name}</h3>
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
