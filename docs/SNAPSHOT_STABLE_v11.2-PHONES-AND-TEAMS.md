# 🧬 SYSTEM SNAPSHOT: v11.2-PHONES-AND-TEAMS

**Data:** 2026-02-04
**Build:** v11.2.0
**Stato:** 🟢 STABILE

## 📋 Changelog Recente

### 1. 🛡️ Normalizzazione Cellulari (v11.1)
- **Logica**: Rimozione automatica spazi e aggiunta prefisso `+39`.
- **Copertura**:
  - **Form Iscrizioni Pubblico**: Input `telefono` e `secondo_cellulare` normalizzati via JS inline.
  - **CRM Dashboard**: Input editabili normalizzati via React state.
  - **Database**: Bonifica record esistenti (es. caso Valvoine/Franco Marchi) tramite SQL manuale.

### 2. 👥 Visualizzazione Team CRM (v11.2)
- **Pairing**: Logica di accoppiamento basata su `team_id` e reciprocità numeri.
- **Ordinamento**:
  1. Team **CONFIRMED** (Accoppiati).
  2. Team **PENDING**.
  3. Piloti **SINGLE**.
- **Design**:
  - **Color Palette 8 Toni**: I team accoppiati hanno sfondi colorati alternati (Giallo, Rosso, Verde, Blu, Viola, etc.) per distinguere visivamente le coppie.
  - **Stesso Colore**: I membri dello stesso team condividono lo stesso colore di sfondo.

### 3. 📝 Modifiche Iscrizioni
- **Assicurazione**: Aggiunto link alle condizioni CSEN Veneto nel form pubblico (`condizioni della polizza assicurativa`).

---

## 🏗️ Stato Tecnico
- **Database**: Trigger di auto-pairing attivo.
- **Frontend**: Componente `RegistrationList` aggiornato con logica di sort e colori `hsla`.
- **Deploy**: Pipeline GitHub/Vercel verde.

---

## 🏁 Prossimi Obiettivi
- Monitoraggio nuove iscrizioni per verificare il pairing automatico.
- Eventuale migrazione infrastruttura (Future).
