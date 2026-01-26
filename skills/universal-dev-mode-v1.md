# 🧬 SKILL: UNIVERSAL_DEV_MODE_v1
**Status:** MANDATORY | **Feature:** UI Debugging

## 🖱️ LOGICA CTRL + CLIC (Quick Inspector)
1. **Trigger:** Ogni elemento UI (Card, Button, Row) deve ascoltare l'evento `onClick` con tasto `Ctrl` (o `Cmd`) premuto.
2. **Azione:** Al trigger, deve aprirsi un pannello/modal di debug (o un log avanzato in console) che mostri:
   - Il DNA dell'elemento (ID, versione, base_plugin_id).
   - I dati grezzi (payload) associati a quel componente.
3. **Persistenza:** Questa modalità deve essere disattivabile globalmente tramite una variabile d'ambiente `DEV_MODE=false`.

## 🛠️ IMPLEMENTAZIONE STANDARD
- Utilizzare un `Hook` o un `Wrapper` universale per non dover riscrivere la logica su ogni singolo plugin.
