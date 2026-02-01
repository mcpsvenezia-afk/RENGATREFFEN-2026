import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RadarTab({ isFullscreen = false }) {
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
                const polyline = window.L.polyline(track.points, {
                    color: track.color,
                    weight: track.weight
                }).addTo(leafletMap.current);
                polylineLayers.current[track.id] = polyline;
            }
        });
    };

    const handleGpxUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input so same file can be selected again
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(event.target.result, "text/xml");
            const trkpts = xmlDoc.getElementsByTagName("trkpt");
            const points = [];

            for (let i = 0; i < trkpts.length; i++) {
                const lat = parseFloat(trkpts[i].getAttribute("lat"));
                const lon = parseFloat(trkpts[i].getAttribute("lon"));
                points.push([lat, lon]);
            }

            if (points.length > 0) {
                const newTrack = {
                    id: Date.now().toString(),
                    name: file.name,
                    color: '#FF0000', // Default Red
                    weight: 3,
                    points: points
                };
                setGpxTracks(prev => [...prev, newTrack]);
            } else {
                alert("Nessun punto traccia trovato nel GPX.");
            }
        };
        reader.readAsText(file);
    };

    const updateTrackProp = (id, prop, value) => {
        setGpxTracks(prev => prev.map(t => t.id === id ? { ...t, [prop]: value } : t));
    };

    const removeTrack = (id) => {
        setGpxTracks(prev => prev.filter(t => t.id !== id));
    };

    const handleManualSave = () => {
        localStorage.setItem('RENGATREFFEN_RADAR_GPX', JSON.stringify(gpxTracks));
        alert("Configurazione salvata nel browser!");
    };


    useEffect(() => {
        fetchInitialData();

        // FALLBACK POLLING (Safety Net) every 15s
        const interval = setInterval(fetchInitialData, 15000);

        // REALTIME SUBSCRIPTION
        const channel = supabase
            .channel('radar-updates')
            // 1. Listen for new Logs (Photos/Checks)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'race_logs' }, (payload) => {
                const newLog = payload.new;
                supabase.from('registrations').select('*').eq('id', newLog.registration_id).single()
                    .then(({ data: reg }) => {
                        if (reg) {
                            newLog.registrations = reg;
                            setLogs(prev => [newLog, ...prev]);
                        }
                    });
            })
            // 2. Listen for Realtime Tracking (Movements)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_tracking' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const updatedTrack = payload.new;

                    setTracking(prev => {
                        const exists = prev.find(t =>
                            t.registration_id === updatedTrack.registration_id &&
                            t.pilot_code === updatedTrack.pilot_code
                        );

                        if (exists) {
                            // Update existing without full refetch if possible
                            // Note: we preserve the '.registrations' join data from the existing object
                            return prev.map(t => {
                                if (t.registration_id === updatedTrack.registration_id && t.pilot_code === updatedTrack.pilot_code) {
                                    return { ...t, ...updatedTrack, registrations: t.registrations };
                                }
                                return t;
                            });
                        } else {
                            // New pilot appearing? We need registration info provided by join
                            // Realtime doesn't send joins. Trigger a refresh or fetch single
                            // For simplicity/robustness on "New Appearance", we can trigger a refresh 
                            // or just fetch this single team details.
                            // Let's trigger a single fetch to be efficient
                            supabase.from('registrations').select('team_name, bib_number, card_color, formula_partecipazione')
                                .eq('id', updatedTrack.registration_id)
                                .single()
                                .then(({ data: regData }) => {
                                    if (regData) {
                                        setTracking(curr => [...curr, { ...updatedTrack, registrations: regData }]);
                                    }
                                });
                            return prev; // Return current until async fetch completes
                        }
                    });
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('✅ Realtime Radar Connected & Listening...');
            });

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);

        console.group('🗺️ RADAR FETCH DATA');

        // Fetch Logs with Joins
        const { data: logsData } = await supabase
            .from('race_logs')
            .select('*, registrations(*)')
            .order('recorded_at', { ascending: false })
            .limit(50);

        if (logsData) setLogs(logsData);
        console.log('📸 Logs fetched:', logsData?.length || 0);

        // Fetch Live Tracking
        const { data: trackingData, error: trackingError } = await supabase
            .from('live_tracking')
            .select('*, registrations!fk_live_tracking_registration(team_name, bib_number, card_color, formula_partecipazione)');

        console.log('📍 Tracking Query Result:', {
            count: trackingData?.length || 0,
            data: trackingData,
            error: trackingError
        });

        if (trackingData) {
            setTracking(trackingData);
            console.log('✅ Tracking state updated with', trackingData.length, 'pilots');
        } else {
            console.warn('⚠️ No tracking data or error:', trackingError);
        }

        console.groupEnd();
        setLoading(false);
    };

    // SETUP LEAFLET
    useEffect(() => {
        if (!mapRef.current) return;
        if (leafletMap.current) return; // Già inizializzato

        // Dynamically load Leaflet CSS/JS logic is assumed done in index.html or here we check window.L
        // Ma per sicurezza controlliamo window.L
        const checkL = setInterval(() => {
            if (window.L) {
                clearInterval(checkL);
                initMap();
            }
        }, 100);

        return () => clearInterval(checkL);
    }, []);

    const initMap = () => {
        leafletMap.current = window.L.map(mapRef.current).setView([45.95, 12.5], 9);

        // STANDARD OPENSTREETMAP TILES (Bright & Clear)
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(leafletMap.current);

        setMapReady(true);
    };

    // Auto-center map on first load of trackers
    // Auto-center map on first load of trackers
    useEffect(() => {
        if (mapReady && tracking.length > 0 && leafletMap.current) {
            // Filter only valid points with actual coordinates
            const validPoints = tracking.filter(t => t.gps_lat && t.gps_lng);

            if (validPoints.length > 0) {
                if (validPoints.length > 1) {
                    const bounds = validPoints.map(t => [t.gps_lat, t.gps_lng]);
                    try {
                        leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                    } catch (e) {
                        console.warn("FitBounds failed", e);
                    }
                } else {
                    const first = validPoints[0];
                    leafletMap.current.setView([first.gps_lat, first.gps_lng], 13);
                }
            }
        }
    }, [mapReady, tracking.length]); // Run only when map becomes ready or trackers count changes (initial load)

    // UPDATE MARKERS
    useEffect(() => {
        if (!leafletMap.current || !window.L) return;

        console.log('🎯 Updating markers for', tracking.length, 'pilots');

        // Clear markers not in tracking
        // (Semplificazione: Rimuoviamo e ricreiamo o aggiorniamo. Per evitare flickering aggiorniamo pos)

        tracking.forEach(t => {
            const id = `${t.registration_id}_${t.pilot_code}`;
            const lat = parseFloat(t.gps_lat);
            const lng = parseFloat(t.gps_lng);

            if (!lat || !lng) return;

            // Icona personalizzata
            const color = t.registrations?.card_color === 'ROSSA' ? 'red' : (t.registrations?.card_color === 'GIALLA' ? 'gold' : 'magenta');

            const iconHtml = `
                <div style="
                    background-color: ${color};
                    width: 14px; height: 14px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 10px ${color};
                "></div>
                <div style="
                    position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
                    background: #000; color: ${color}; padding: 2px 5px; border-radius: 4px; font-weight: bold; font-size: 10px;
                    white-space: nowrap;
                ">
                    ${t.registrations?.bib_number || 'P-' + t.registration_id.slice(0, 4)} ${t.pilot_code}
                </div>
            `;

            const icon = window.L.divIcon({
                className: 'custom-pin',
                html: iconHtml,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            if (markers.current[id]) {
                markers.current[id].setLatLng([lat, lng]);
                markers.current[id].setIcon(icon);
                markers.current[id].setPopupContent(`
                        <div style="color: #000">
                            <b>Team ${t.registrations?.bib_number}</b><br/>
                            ${t.registrations?.team_name}<br/>
                            Pilota ${t.pilot_code}<br/>
                            Last seen: ${new Date(t.last_seen).toLocaleTimeString()}
                        </div>
                    `);
            } else {
                const m = window.L.marker([lat, lng], { icon }).addTo(leafletMap.current)
                    .bindPopup(`
                        <div style="color: #000">
                            <b>Team ${t.registrations?.bib_number}</b><br/>
                            ${t.registrations?.team_name}<br/>
                            Pilota ${t.pilot_code}<br/>
                            Last seen: ${new Date(t.last_seen).toLocaleTimeString()}
                        </div>
                    `);
                markers.current[id] = m;
            }
        });

    }, [tracking]);

    const containerStyle = isFullscreen ? {
        padding: 0,
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: '#0c0c0e'
    } : {
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

    const mapContainerStyle = isFullscreen ? {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    } : cardStyle;

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
            <div style={mapContainerStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', padding: isFullscreen ? '20px' : 0 }}>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>🛰️ GEOPOINT <span style={{ color: '#FFCC00' }}>PRO RADAR</span></h2>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={fetchInitialData} style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid #444', padding: '6px 15px',
                            borderRadius: '10px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, color: '#fff'
                        }}>
                            🔄 REFRESH
                        </button>
                        <button onClick={() => {
                            console.log("⚠️ RESETTING MAP...");
                            setTracking([]);
                            setLogs([]);

                            // Hard Reset Leaflet
                            if (leafletMap.current) {
                                leafletMap.current.off();
                                leafletMap.current.remove();
                                leafletMap.current = null;
                            }
                            markers.current = {};
                            polylineLayers.current = {}; // FIX: Clear GPX layers ref too!
                            setMapReady(false);

                            // Re-init after brutal clear
                            setTimeout(() => {
                                initMap();
                                fetchInitialData();
                            }, 500);
                        }} style={{
                            background: '#FF4444', border: 'none', padding: '6px 15px',
                            borderRadius: '10px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, color: '#fff'
                        }}>
                            ⚠️ RESET MAPPA
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
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '10px', paddingLeft: isFullscreen ? '20px' : 0, paddingRight: isFullscreen ? '20px' : 0 }}>
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
                    <div ref={mapRef} style={{ flex: 1, borderRadius: isFullscreen ? 0 : '15px', background: '#000' }}></div>
                )}
            </div>

            {/* STREAM FOTO & LOGS - NASCOSTO SE FULLSCREEN */}
            {!isFullscreen && (
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
            )}

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
