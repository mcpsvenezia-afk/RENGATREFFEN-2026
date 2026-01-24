# 🧬 SKILL: PROJECT_GOAL_BLITZ_REG_v1
**Project:** Blitz Registration Manager | **Deadline:** 120min

## 📝 OBIETTIVO CORE
Realizzare un sistema modulare per la raccolta iscrizioni e una dashboard di gestione protetta.

## 🗄️ DATA SCHEMA (Supabase)
Table: `registrations`
- `id`: uuid (primary key)
- `created_at`: timestamp
- `nome`, `cognome`, `email`, `telefono`: text
- `partner_name`: text (campo "farò coppia con")

## 🔐 AUTH & ACCESS
- **Public:** Accesso libero al modulo di iscrizione.
- **Admin:** Accesso tramite Magic Link (Supabase Auth). 
- **RLS Policy:** Solo gli utenti autenticati (Admin) possono leggere i dati. Tutti possono inserire dati.

## 🎨 UI/UX COMPONENTS (Carbon Style)
1. **Registration Form:** Input puliti, validazione email, feedback di successo.
2. **Admin Dashboard:** Tabella responsiva dei risultati con funzione "Esporta" (opzionale).
3. **Universal Dev Mode:** Ctrl+Clic attivo su ogni riga della tabella per vedere il JSON dell'iscritto.
