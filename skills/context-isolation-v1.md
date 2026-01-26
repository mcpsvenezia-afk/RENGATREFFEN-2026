# 🧬 SKILL: CONTEXT_ISOLATION_v1
**Status:** MANDATORY | **Goal:** Zero Contamination

## 🧠 ISOLAMENTO COGNITIVO
- L'AI deve ignorare totalmente qualsiasi variabile, tabella o percorso file appartenente a progetti precedenti (es. GeoPoint, Watzon).
- Se l'AI rileva un'analogia con un vecchio progetto, deve ignorarla e chiedere i parametri specifici per il progetto attuale.

## 📊 DATA ARCHITECTURE
- Non assumere mai l'esistenza di tabelle predefinite. 
- Ogni connessione a database deve essere definita da zero in questo workspace.
