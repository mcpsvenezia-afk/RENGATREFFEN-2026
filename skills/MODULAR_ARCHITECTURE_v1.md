# 🧬 SKILL: MODULAR_ARCHITECTURE_v1
**Status:** MANDATORY | **Goal:** Maintenance & Scalability

## 📂 REGOLA DEL FILE UNICO (Atomic Files)
1. **Un File, Una Funzione:** Ogni nuova funzionalità, componente UI o logica di business deve risiedere in un file separato.
2. **Nomenclatura Semantica:** I nomi dei file devono essere auto-esplicativi.
   - Formato: `[tipo]-[nome-funzione]-[versione].js`
   - Esempi: `plugin-registration-form-v1.js`, `core-auth-handler-v1.js`, `api-supabase-config-v1.js`.

## 🧩 ARCHITETTURA A COMPONENTI
- È vietato creare file "monolite" che contengono sia la logica che la UI che le chiamate al database.
- Ogni modulo deve essere importabile e testabile singolarmente.
