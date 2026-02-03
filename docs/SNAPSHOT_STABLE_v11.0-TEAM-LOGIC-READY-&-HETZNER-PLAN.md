# 🧬 SYSTEM SNAPSHOT: v11.0-TEAM-LOGIC-READY-&-HETZNER-PLAN

**Data:** 2026-02-04
**Build:** v11.0.0-GOLD-READY
**Stato:** 🟢 STABILE / PRONTO PER MIGRAZIONE

## 📋 Riepilogo Sviluppo Sessione

### 1. Certificazione CRM v9.0
- **Chat WhatsApp-style:** Interfaccia di messaggistica avanzata con supporto per note interne e risposte rapide.
- **Supporto Allegati:** Integrazione completa per la ricezione e la visualizzazione di allegati (foto documenti, ricevute) direttamente dal pannello CRM.
- **Workflows:** Automatizzazione delle risposte e gestione dello stato (Nuovo, Letto, Risposto, Archiviato).

### 2. Architettura Team (v10.1 - v10.22)
- **Pairing Reciproco:** Implementazione della logica di accoppiamento automatico basata sui numeri di cellulare reciproci inseriti in fase di iscrizione.
- **Scoring & Ranking:** Sistema di calcolo punteggi (scostamento temporale) basato sul Capitano (Pilota A) con monitoraggio "Bozza" per il Partner (Pilota B).
- **Validazione Foto:** Sistema di verifica manuale/automatica delle prove fotografiche con aggiornamento istantaneo della classifica.
- **Normalizzazione ID:** Risoluta la gestione degli ID (numeric vs string) per garantire l'integrità dei log tra i database.

### 3. Infrastruttura & Deploy
- **GitHub Actions:** Pulizia dei workflow e risoluzione del blocco "Rate Limit" su Vercel.
- **Clean Build:** Verificata l'integrità del pacchetto di distribuzione (`npm run build` OK).

---

## 🚀 PIANO MIGRAZIONE HETZNER (DOCKER-FIRST)

**Obiettivo:** Trasferire l'intero ecosistema da Vercel/Supabase Managed a un'infrastruttura dedicata su Hetzner per scalabilità e controllo totale.

### 🏗️ Architettura Proposta
- **Cloud VPS:** Hetzner Cloud (CX21 o superiore).
- **Orchestrazione:** Docker Compose.
- **Database:** PostgreSQL (Self-hosted via Docker) + Container Supabase (PostgREST, GoTrue/Auth, Realtime).
- **Storage:** MinIO o Local Volume (Storage S3-compatible).
- **Web App:** Nginx Proxy Manager / Traefik (HTTPS via Let's Encrypt).

### 🛠️ Fasi del Piano
1. **Configurazione VPS:** Setup Ubuntu + Docker + Firewall.
2. **GitHub Actions CD:** Configurazione workflow per build Docker images e deploy via SSH/Webhooks.
3. **Migrazione Dati:** Export dei dati attuali da Supabase e Import nel nuovo DB locale.
4. **DEV/PROD Separation:** Setup di due istanze (sandbox e live) sullo stesso server tramite porte/domini separati.

---

## 🏁 Prossimi Step (Post-Snapshot)
- Implementazione della visualizzazione "Team Verificati" per pulire la dashboard dai duplicati dei singoli piloti.
- Setup environment Hetzner iniziale.

*Firmato,*
**Ambrogio (Antigravity AI Coding Assistant)**
