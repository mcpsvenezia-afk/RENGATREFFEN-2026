# 🧬 SKILL: BLITZ_CONVENTION_v1

## 🏛️ IL PRINCIPIO DELLA CONVENZIONE
Per eliminare ogni dubbio durante i riavvii o le scansioni, Ambrogio deve seguire regole di nomenclatura e posizionamento "granitiche". Se una cosa non segue la convenzione, è considerata un bug.

### 1. Naming Standard (Case Sensitivity)
- **File JS:** `kebab-case` (es. `plugin-auth-manager.js`).
- **Cartelle:** `kebab-case` (es. `/form-logic`).
- **Variabili/Funzioni:** `camelCase` (es. `saveRegistrationData`).
- **Database/JSON Key:** `snake_case` (es. `partner_name`).

### 2. Il "Matrimonio" tra File (Mapping)
- Ogni file in `/schemas` deve avere un corrispondente in `/plugins` con lo stesso nome base.
  - Esempio: `/schemas/user-reg.json` -> `/plugins/user-reg-engine.js`.
- Se Ambrogio non trova il "partner" di un file, deve segnalare l'incoerenza prima di procedere.

### 3. Struttura delle Esportazioni
- Ogni modulo deve esportare una funzione principale con lo stesso nome del file (in PascalCase).
  - File: `plugin-dynamic-form.js` -> `export default function DynamicForm()`.

### 4. Localizzazione della Logica
- **UI:** Solo in `/plugins`.
- **Database Query:** Solo in `/core`.
- **Dati Statici/Config:** Solo in `/schemas`.
