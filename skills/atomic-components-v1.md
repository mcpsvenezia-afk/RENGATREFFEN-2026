# 🧬 SKILL: ATOMIC_COMPONENTS_v1

## 🧱 REGOLA DELL'ATOMO (Separazione Fisica)
Ambrogio deve forzare la creazione di file fisicamente distinti per ogni entità logica o visiva del progetto. È severamente vietato accorpare più moduli o funzioni complesse nello stesso file.

### 📋 REQUISITI DI SEPARAZIONE TASSATIVI:
1. **Moduli Funzionali:** Ogni modulo operativo (es. Modulo Contatti, Form di Iscrizione, Gestore Commenti) deve avere il proprio file dedicato.
2. **Pagine (Routes):** Ogni singola pagina del sito deve risiedere in un file separato (es. `page-home.js`, `page-admin-dashboard.js`).
3. **Componenti Standalone:** Qualsiasi elemento che possa avere una vita propria o essere riutilizzato (es. una Card, un Bottone speciale, una Modale di errore) deve avere il suo file indipendente.
4. **Logica vs UI:** La logica di calcolo o di connessione dati non deve mai "sporcare" il file della UI. Se una funzione può stare da sola, deve avere il suo file.

## 🏷️ NOMENCLATURA AUTO-ESPLICATIVA
I file devono essere nominati in modo che sia immediatamente chiaro il loro contenuto:
- `form-[nome].js` per i moduli.
- `page-[nome].js` per le pagine intere.
- `comp-[nome].js` per i componenti grafici.
- `logic-[nome].js` per gli script di puro calcolo o API.
