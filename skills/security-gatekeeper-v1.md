# 🛡️ SKILL: SK_04 (Security Gatekeeper)
**Versione:** 1.0.0
**Ambito:** Protezione Dashboard Admin

## 🔐 PROTOCOLLO OTP (One-Time Password)
Tutta l'area dashboard (`/admin` o `/src/App.jsx`) deve essere protetta dal componente `AdminGatekeeper`.

### 📋 REQUISITI TASSATIVI:
1. **Authorized Email:** Solo l'indirizzo `augello.mario@gmail.com` è autorizzato all'accesso.
2. **Double Verification:** 
   - Fase 1: Verifica della mail nel database Supabase.
   - Fase 2: Invio e verifica del codice OTP (8 cifre) tramite magic link/otp email.
3. **Session Singleton:** Una volta autenticato, il componente deve gestire la persistenza della sessione locale per evitare re-login continui nello stesso giorno.
4. **Dev Mode Interaction:** Se `RENGATREFFEN_DEV_MODE` è attivo, il gatekeeper può mostrare bypass o log di debug, ma il controllo email resta il firewall primario.

## 🧱 IMPLEMENTAZIONE FISICA
- File: `src/components/comp-admin-gatekeeper.jsx`
- Wrapper: Il componente `App` deve restituire il JSX avvolto da `<AdminGatekeeper>`.
