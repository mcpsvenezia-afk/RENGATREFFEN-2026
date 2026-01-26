# 🧬 SKILL: BLITZ_STACK_PLUGIN_RULES_v1
**Status:** MANDATORY | **Stack:** Supabase + Vercel

## 🌐 INFRASTRUTTURA & DEPLOY
1. **Cloud-Only Policy:** È vietato l'uso di `localhost`. Ogni test e sviluppo deve avvenire in ambiente remoto.
2. **Hosting:** Vercel (Frontend & Serverless Functions).
3. **Database:** Supabase (PostgreSQL, Auth, Storage).
4. **Sincronia:** Ogni modifica alla logica deve essere immediatamente pronta per il deploy su Vercel.

## 🔌 ARCHITETTURA A PLUGIN (Inviolabile)
Il sistema è modulare. Ogni funzionalità è un "Plugin" con il proprio DNA.

### 1. Regola della Non-Sovrascrittura
- È vietato sovrascrivere un file plugin esistente o un record nel database.
- Ogni modifica genera una **Nuova Versione**. Il passato non si cancella, si archivia.

### 2. Identificazione e Seme
- Ogni plugin deve avere un `base_plugin_id` (il Seme) univoco e immutabile (es: `blitz-auth-manager`).
- La versione deve seguire rigorosamente il **SemVer** (es: `v1.0.1`).
- È vietata la generazione di nomi fantasia (No Titan, No Phoenix).

### 3. Struttura del Database (plugins_marketplace)
- Ogni inserimento nel database deve prevedere il controllo di unicità su `base_plugin_id`.
- Se esiste già una versione, l'AI deve proporre un incremento di versione, mai una sostituzione.

### 4. Isolamento Logico
- Un plugin non deve mai dipendere direttamente dal codice interno di un altro plugin. 
- Comunicano solo tramite API o eventi definiti nel Core.
