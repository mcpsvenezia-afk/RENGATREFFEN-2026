---
name: Radar-Hardcore-Protocol v1
description: Protocollo definitivo per la gestione del tracking GPS critico e della visualizzazione Radar.
---

# Radar Hardcore Protocol v1

## 🎯 Obiettività
Garantire che il tracking dei piloti sia INARRESTABILE e che la visualizzazione Admin sia A PROVA DI CRASH.

## 📡 Regole di Ingaggio (Pilot App)

### 1. FORCE-GPS (Anti-Stallo)
- Utilizzare `setInterval` (Polling) anziché `watchPosition`.
- Monitorare `last_gps_update`.
- Se `Date.now() - last_gps_update > 30000` (30s):
  - Riavviare il watcher/interval del GPS.
  - Tentare un reset del Wake Lock.
  - Inviare log di errore 'GPS_STALLED'.

### 2. DB-HEARTBEAT (Alive Signal)
- Inviare SEMPRE un aggiornamento al DB ogni ciclo (es. 10s), anche se lat/lng sono identici.
- Questo aggiorna `last_seen` e conferma che l'app è in primo piano e attiva.
- Scrivere su `tracking_debug_logs` per diagnosi approfondita:
  - Coordinate
  - Accuracy
  - Timestamp
  - Stato Batteria (se disponibile)

### 3. UI-FEEDBACK (Verità per il Pilota)
- Indicatore "GPS: OK" solo se fix ricevuto < 10s fa.
- Indicatore "GPS: STALLO" se > 10s.
- Indicatore "GPS: ERRORE" se errore API.

## 🗺️ Regole di Visualizzazione (Admin Radar)

### 1. NO-MAP-CRASH (Resilienza)
- `fitBounds` deve sempre essere protetto da `try-catch`.
- Filtrare rigorosamente coordinate `null`, `undefined` o `NaN` prima di passarle a Leaflet.
- Se 0 punti validi: Fallback su Centro Gara (es. Udine).

### 2. CACHE-BUST (Reset)
- Tasto "RESET MAPPA" obbligatorio.
- Deve:
  - Rimuovere tutti i marker.
  - Invalidare la cache dimensioni mappa (`map.invalidateSize()`).
  - Forzare un re-fetch dei dati.

## 🛠️ Implementazione
Questo protocollo richiede la tabella `tracking_debug_logs` per il monitoraggio.
