# SNAPSHOT TECNICO v7.7 (THE VAULT)
**Data:** 31/01/2026
**Stato:** CONSOLIDATO (Security Hardened)
**Operatore:** Ambrogio (Antigravity)

## 🔐 SECURITY & INTEGRITY (SK_04)
- **OTP Gatekeeper Attivo:** Dashboard protetta in `App.jsx` tramite il componente `AdminGatekeeper`.
- **Target Email:** Accesso riservato esclusivamente a `augello.mario@gmail.com` via magic-code a 8 cifre.
- **Supabase Singleton:** Refactoring completato. Il client Supabase viene inizializzato esclusivamente in `src/lib/supabaseClient.js`, eliminando i warning "Multiple GoTrueClient instances".

## ⚙️ CONFIGURAZIONE & DATABASE
- **Tabella Settings:** Creato script `docs/SCHEMA_SETTINGS_v7.7.sql` per la gestione centralizzata di:
  - `max_moto`: 30
  - `max_4x4`: 10
  - `is_open`: true/false (Switch iscrizioni online)
- **Tab Impostazioni:** Ora collegata logicamente ai parametri di overbooking in `src/core/logic-database-v1.js`.

## 📋 RIEPILOGO ASSET v7.7
- **UI:** Tab su due righe, Sticky Footer Mobile, Social Share.
- **CRM:** Flag **⚠️ DUPLICATO** e **⏳ LISTA ATTESA** visibili in header.
- **DNA:** Matrioshka v1.5.1 attiva (ID Livello, Clipboard Gerarchica).
- **Email:** Integrazione Resend completa per tutte le fasi (Conferma, Approvazione, Slittamento).

---
*Snapshot v7.7 validato. Protocolli di Sicurezza SK_04 caricati.*
