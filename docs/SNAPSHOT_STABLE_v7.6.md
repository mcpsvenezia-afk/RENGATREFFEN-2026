# SNAPSHOT TECNICO E VERIFICA v7.6
**Data:** 31/01/2026
**Stato:** STABILE
**Operatore:** Ambrogio (Antigravity)

## 📋 Riepilogo Modifiche (Ultime 60 minuti)

### 🖥️ UI Desktop & Dashboard
- **Spostamento Totale Dovuto:** Il calcolo automatico della quota ora è visibile e aggiornato in tempo reale nel form di iscrizione (`iscrizioni.html`).
- **Tab su due righe:** La barra di navigazione della dashboard gestisce correttamente i contenuti, garantendo accessibilità.
- **Flag Colorati CRM:** Sono stati implementati i colori dinamici per i team nella dashboard e nell'anteprima PDF (light pastel colors) per una migliore scansione visiva.
- **Report PDF v2:** Aggiunte opzioni per orientamento (**Orizzontale/Verticale**) e modalità colore (**Colori/BN**). Rimossi titoli ridondanti per un look "Clean".

### 📱 UI Mobile
- **Layout Verticale:** Ottimizzazione dei componenti per la visualizzazione su schermi ridotti.
- **Sticky Footer:** Implementazione di una barra fissa per le azioni principali.
- **Pulsante Condividi:** Aggiunta funzionalità di condivisione rapida.

### 🧬 Protocollo DNA (Digital Native Architecture)
- **ID Numerici Visibili:** Ogni componente ha ora l'ID (data-dna) visibile a schermo quando la funzione "MOSTRA DNA" è attiva in modalità DEV.
- **Super Matrioska Clipboard:** Il plugin `renga-dev-loader-v1.js` ora cattura l'intera gerarchia del componente cliccato (CTRL+Click) e la copia nella clipboard in formato strutturato `<URL:... ID:... TYPE:... -->`.
- **Visibility Toggle:** Introdotta la possibilità di nascondere i badge DNA pur rimanendo in modalità DEV (bypass controlli).

### 🧠 Logica & Database
- **Anti-Duplicato Intelligente:** Implementato bypass del controllo mail/telefono univoco se `RENGATREFFEN_DEV_MODE` è attivo. In produzione, il controllo rimane granulare su nome/cognome, mail e telefono.
- **Calcolo Automatico Quote:** Logica centralizzata in `updateTotal()` su `iscrizioni.html` che distingue tra Formule Moto, 4x4, Passeggeri e Ospiti Pranzo, con tariffa speciale (0€) per il team 'staff'.
- **Bypass Overbooking Dev:** Possibilità di forzare iscrizioni oltre il limite di 30 (moto) o 10 (4x4) se in modalità sviluppatore.

## 📁 File Consolidati
- `src/App.jsx` (Dashboard & PDF Preview)
- `src/core/logic-database-v1.js` (Bypass duplicati & Overbooking)
- `src/plugins/renga-dev-loader-v1.js` (Visibility Toggle & Clipboard Matrioska)
- `iscrizioni.html` (UI Form & Calcolo Quote)
- `api/send-confirmation.js` (Logic Email & Stati)

---
*Snapshot v7.6 validato internamente. In attesa di validazione ALDO.*
