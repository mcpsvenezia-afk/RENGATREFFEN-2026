# 🏗️ SNAPSHOT DI STATO: STABLE v1.0
**Data:** 25 Gennaio 2026 - 19:40
**Progetto:** Renga Treffen 2026
**Stato:** 🟢 OTTIMIZZATO (Punto Zero di Stabilità)

---

## 📂 Architettura del Progetto

La struttura segue un approccio modulare e orientato ai plugin per garantire flessibilità e manutenibilità.

```text
RENGATREFFEN/
├── public/                 # Asset statici e Schemi JSON
│   └── schemas/           # Definizione dei form dinamici (DNA)
├── src/
│   ├── components/        # Componenti Core React (Dashboard, CRM, Form)
│   ├── lib/              # Client esterni (Supabase, API)
│   ├── plugins/          # Motori di rendering dinamico (Dynamic Form Engine)
│   ├── main.ts           # Entry point dell'applicazione
│   └── style.css         # Design System (Aesthetics Premium)
├── scripts/              # Utility SQL e automazione database
├── docs/                 # Documentazione Snapshot e Manuali
└── IMPLEMENTATION_PLAN.md # Roadmap di sviluppo
```

---

## 📜 Inventory (File & Versioni)

### 🧬 Core & Plugins
- `src/plugins/dynamic-form-engine-v1.1.0.js` -> **v1.2.0** (Radio Buttons v2, Vertical List)
- `src/plugins/plugin-registration-engine-v1.1.0.js` -> **v1.1.5** (Success UI fixed)
- `src/plugins/plugin-contact-engine-v1.js` -> **v1.0.2** (Zero Native Alerts)
- `src/plugins/renga-dev-loader-v1.js` -> **v1.0.0** (Inspector DNA)

### 🖥️ Dashboard & CRM
- `src/components/comp-crm-panel.jsx` -> **v5.6.0** (Reordered Sidebar, Full Edit, Note Management)
- `src/components/comp-registration-list.jsx` -> **v1.0.5**
- `src/components/comp-message-list.jsx` -> **v1.0.2**

### 📊 Database & SQL
- `scripts/enable-attachments.sql` -> **v5.0** (Master Table & RLS)
- `public/schemas/registration-schema-v1.1.0.json` -> **v1.2.0** (Full Schema DNA)

---

## ⚙️ Status Logico

### 1. Modulo Iscrizione (Dynamic DNA)
Il sistema carica uno schema JSON dinamico (`/schemas/registration-schema-v1.1.0.json`). Il plugin `renderDynamicForm` trasforma questo schema in un'interfaccia React/Vanilla:
- **Radio Buttons:** Implementati con stile a lista verticale (Premium Traditional).
- **Validazione:** Controllo caratteri e obbligatorietà campi in tempo reale.
- **Integrazione:** Salvataggio diretto su tabella `registrations` di Supabase con upload foto su storage.

### 2. CRM Activity Log (Master Sidebar)
Il sistema di gestione interna segue una logica "Inverted Logic":
- **Sidebar CRM:** Riordinata seguendo il flusso operativo: *Pulsante Aggiungi -> Input Testo -> Log Storico -> Allegati*.
- **Note Management:** Supporto completo CRUD (Creazione, Lettura, Modifica, Cancellazione) con conferma modale.
- **Editabilità:** Ogni tab della dashboard riflette i campi del DB e permette il salvataggio globale (Sincro-Total).

---

## 🧬 Database DNA (Supabase Schema)

### Tabella: `registrations`
Contiene tutti i dati dei piloti (Nome, Team, Moto, Pagamenti, Requisiti, Bio).

### Tabella: `registration_notes` / `message_notes`
- `id`: UUID (Primary Key)
- `content`: TEXT (Contenuto della nota)
- `admin_name`: TEXT (Chi ha scritto la nota)
- `created_at`: TIMESTAMPTZ

### Tabella: `crm_attachments`
- `id`: UUID
- `registration_id`: Foreign Key (`registrations`)
- `message_id`: Foreign Key (`messages`)
- `file_url`: TEXT
- `file_name`: TEXT

---

## ✅ CONFERMA DI STABILITÀ
Questo documento certifica che la build attuale è considerata **STABILE e OTTIMIZZATA**. Ogni nuova funzione o debbuging successivo a questo timestamp (25/01/2026 19:40) è ufficialmente considerato **POST-SNAPSHOT**.

**Firmato:** Antigravity (Ambrogio) 🧬
