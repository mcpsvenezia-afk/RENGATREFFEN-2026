---
name: race_app_hybrid_management
description: Gestione, Sviluppo e Deploy della Race App ibrida (APK Lite + PWA) per Renga Treffen.
author: Ambrogio (Antigravity)
version: 1.0
---

# 🏎️ Race App Hybrid System

La "Race App" è il terminale utilizzato dai piloti ed è composta da due layer distinti per garantire affidabilità GPS e flessibilità UI.

## 1. Architettura Ibrida

### A. APK Nativo (LITE) - *The Tracker*
*   **Ruolo:** Wrapper nativo Android.
*   **Responsabilità Unica:** Mantenere attivo il tracciamento GPS in **Background** (evitando che Android uccida il processo web) e inviare le coordinate grezze a Supabase (`gps_logs`).
*   **UI:** Minima/Nulla. Carica la Web App in una WebView persistente.

### B. Web App / PWA (`race-app.html`) - *The Dashboard*
*   **Ruolo:** Interfaccia Utente Interattiva.
*   **Accesso:** Caricata dentro l'APK o via browser (Safari/Chrome) come fallback.
*   **Responsabilità:**
    *   Gestione Flusso Gara (Login Team, Foto Prove).
    *   Display Info (Cronometro, Penalità, GPS Status).
    *   Upload Media (Foto compresse a 1024px/50%).
    *   **Fallback GPS**: Se usata via browser, utilizza `navigator.geolocation.watchPosition` (richiede schermo acceso).

## 2. Flusso Dati & Scoring (Master-Slave)

Per garantire la coerenza dei dati tra decine di device e la regia:

*   **Source of Truth (MASTER):** La dashboard `comp-admin-rankings.jsx`.
    *   Calcola le penalità basandosi sui `target_times` e sulle regole (es. Tolleranza 60s).
    *   Scrive il risultato nel campo `score_caccia` della tabella `registrations`.
*   **Race App (SLAVE):**
    *   NON effettua calcoli complessi.
    *   Legge ogni 30s il valore `score_caccia` da Supabase e lo visualizza.

## 3. Protocollo di Aggiornamento (Deployment)

Ogni modifica a `race-app.html` DEVE seguire questa pipeline:

1.  **DEV (Locale/Preview):**
    *   Modifica codice.
    *   Test logica con team di test (ID: 0000...).
2.  **TEST (Staging):**
    *   Verifica su dispositivo mobile reale (Android/iOS).
    *   Verifica visualizzazione Dashboard Admin.
3.  **PROD (Live):**
    *   Commit su `main`.
    *   Push verso Vercel (Automatico).
    *   *Nota:* Se si modifica la logica GPS nativa, è necessario ricompilare l'APK. Le modifiche HTML/JS sono immediate.

## 4. Troubleshooting Rapido

*   **"Sparito Tutto":** Verificare che l'Header sia dentro `#race-ui` e non in container nascosti.
*   **"Foto non si vedono":** Verificare Bucket Supabase `race_photos` e permessi RLS.
*   **"Punteggio Diverso":** Impossibile per design. Se accade, la Sync Admin -> DB è ferma. Forzare refresh Dashboard Admin.
