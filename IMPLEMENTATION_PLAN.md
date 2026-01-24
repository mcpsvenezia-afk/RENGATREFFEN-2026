# Progetto Renga Treffen 2026 - Recap e Next Steps

## 🏁 Stato Attuale del Progetto
1.  **Sito Web Ricostruito**: Il design è completo e rispecchia fedelmente l'originale con estetica Premium.
2.  **Struttura Multipage**:
    - `index.html`: Homepage con Hero 2026, Timeline (6 step), Regolamento, Staff e Form Iscrizioni.
    - `sponsor.html`: Pagina dedicata con Timeline dei Premi Principali, Ringraziamenti (Comune/Moto Club) e Partner Tecnici.
3.  **Form Iscrizioni**: Attualmente configurato con un backend PHP per Aruba, ma già pronto per essere convertito.
4.  **Aesthetics**: Implementata la palette colori 2026 (Giallo, Fucsia, Oro, Nero, Borgogna) e animazioni di reveal.

## 🚀 Prossima Fase (Domani): Migrazione Vercel + Supabase
L'obiettivo è abbandonare il vecchio sistema FTP/PHP a favore di uno stack moderno.

### Obiettivi per domani:
1.  **Configurazione Supabase**:
    - Creazione tabella `iscrizioni` (id, team_name, p1_name, p1_email, p2_name, p2_email, moto, phone, created_at).
    - Impostazione delle chiavi di accesso (URL e API Key).
2.  **Aggiornamento Frontend**:
    - Modifica di `main.ts` per inviare i dati direttamente a Supabase invece del file PHP.
3.  **Deploy su Vercel**:
    - Collegamento della repository e messa online del sito.
4.  **Dashboard Iscrizioni**:
    - Verifica del salvataggio dati e test della funzione di esportazione CSV per la gestione partecipanti.

## 📝 Appunti per il riavvio
- Chiedere all'utente le chiavi di Supabase (o guidarlo nella creazione del progetto).
- Eliminare `process_registration.php` una volta confermato il funzionamento del nuovo sistema.
- Verificare se l'utente vuole aggiungere un sistema di invio email automatico tramite Supabase Edge Functions o database triggers.

---
*Documento creato il 20/01/2026 per continuità sessione.*
