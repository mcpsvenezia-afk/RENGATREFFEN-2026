# 🧬 SKILL: UNIVERSAL_DEV_MODE_v2
**Status:** PENDING ACTIVATION | **Feature:** UI Debugging & DNA Tracking

## 🧬 PROTOCOLLO DNA TRACKING (v2)
Il DNA Tracking Protocol v2 introduce l'obbligatorietà dell'identificazione atomica persistente direttamente nel codice sorgente tramite marcatori HTML invisibili.

### 🚩 REQUISITI DI TRACCIAMENTO TASSATIVI:
1.  **Commento Mandatorio**: Ogni componente atomico (Card, Header, Section, Button complesso) deve essere preceduto da un commento di tracciamento.
2.  **Formato Standard**: 
    `<!-- URL:[CurrentURL] ID [DNA_ID] -->`
    *   *Esempio*: `<!-- URL:https://www.rengatreffen.it/timetable ID 2234 -->`
3.  **Posizionamento**: Il marcatore deve essere posizionato immediatamente prima dell'apertura del tag HTML principale del componente.
4.  **Integrità durante l'aggiornamento**: Ogni nuovo frammento di codice, aggiornamento di plugin o patch UI deve includere o preservare questo header univoco.

## 🖱️ LOGICA CTRL + CLICK (Inspector v2)
1.  **Trigger**: `Ctrl` (o `Cmd`) + Click su qualsiasi elemento UI.
2.  **Azione**: 
    - Il sistema deve scansionare i nodi precedenti nel DOM per individuare il marcatore DNA.
    - Se trovato, deve includere l'URL e l'ID DNA nel payload di copia.
3.  **Visual Feedback**: Mostrare un popup "MISSION ACCOMPLISHED" con l'ID DNA rilevato.

## 🛠️ IMPLEMENTAZIONE
- L'ispettore deve essere in grado di gestire sia tag personalizzati `<URL:...>` che commenti standard `<!-- URL:... -->` per garantire la massima compatibilità cross-browser.
