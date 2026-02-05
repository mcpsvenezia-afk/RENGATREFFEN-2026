---
name: mobile_dev_flutter_standard
description: STANDARD AZIENDALE OBBLIGATORIO per lo sviluppo Mobile (APK/IPA).
author: Ambrogio (Antigravity)
version: 12.0 (Official)
---

# 📱 FLUTTER MOBILE STANDARD

**AVVISO:** Da questo momento (v12.0), Flutter è l'unico framework ammesso per lo sviluppo di app mobili native.

## 1. Architettura di Riferimento

Le app "Renga-style" devono seguire questa architettura **Offline-First**:

1.  **Frontend:** Flutter WebView (per caricare la Web App esistente).
2.  **Core Nativo (Indipendente dalla WebView):**
    *   **Background Service:** Un Isolate Dart separato che sopravvive alla chiusura della UI.
    *   **GPS Manager:** Geolocator stream -> DB Locale.
    *   **Local DB:** SQFlite per bufferizzare i dati quando offline.
    *   **Sync Manager:** Worker che svuota il DB locale verso Supabase appena torna la rete.

## 2. Requisiti Critici Android

*   **Foreground Service:** Obbligo di notifica persistente ("Renga Race in esecuzione...") per prevenire il kill da parte di Android Doze Mode.
*   **Permessi:**
    *   `ACCESS_FINE_LOCATION`
    *   `ACCESS_BACKGROUND_LOCATION`
    *   `FOREGROUND_SERVICE`
    *   `REQUEST_INSTALL_PACKAGES` (per auto-update)

## 3. Auto-Update Proprietario

L'app deve bypassare il Play Store per aggiornamenti rapidi sul campo:
1.  Check `version.json` remoto all'avvio.
2.  Se `remote > local` -> Download APK con `dio`.
3.  Installazione tramite Intent (`open_file` o `r_upgrade`).

## 4. Comandi Build (Locale)

```bash
flutter pub get
flutter build apk --release
```
