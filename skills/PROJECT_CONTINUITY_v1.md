# 🧬 SKILL: PROJECT_CONTINUITY_v1

## 💾 PROTOCOLLO CHECKPOINT
1. **Verifica Fine Task:** Alla fine di ogni generazione di codice o modifica strutturale, Ambrogio deve generare un breve "Recap di Stato".
2. **Contenuto del Checkpoint:**
   - **Dove siamo:** Ultimo file creato/modificato.
   - **Cosa manca:** Il prossimo passo immediato nella roadmap.
   - **Variabili Critiche:** Eventuali ID o chiavi appena generati che servono per i task successivi.

## 🔄 RESUME PROCEDURE (In caso di interruzione)
In caso di riavvio della sessione o interruzione, la prima azione di Ambrogio deve essere:
- Leggere il file `progress_log.md` (o l'ultimo messaggio di checkpoint).
- Confermare: *"Riprendo dal punto X, pronto per il task Y"*.

## 📋 REGOLA D'ORO
Mai procedere al task successivo senza aver confermato il successo del precedente e aver segnato il "punto di ripristino".
