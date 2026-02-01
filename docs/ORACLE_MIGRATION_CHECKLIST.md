# 🚀 ORACLE MIGRATION CHECKLIST
**Last Local Checkpoint - Windows PC**  
**Target Environment: Linux/Ubuntu on Oracle Cloud**

---

## 📋 CRITICAL ISSUES TO RESOLVE ON MIGRATION

### 1. ❌ Eliminazione Directory Fantasma `.gemini`
- **Issue**: Directory `.gemini` presente nel filesystem locale
- **Action**: Rimuovere completamente dal progetto prima del deploy Oracle
- **Priority**: HIGH
- **Status**: PENDING

### 2. 🌐 DNS Migration
- **Current**: DNS puntano a Vercel
- **Target**: DNS devono puntare all'IP Fisico Oracle
- **Action**: 
  - Aggiornare record A/AAAA su provider DNS
  - Configurare reverse proxy (Nginx/Caddy) su Oracle
  - Verificare SSL/TLS certificates
- **Priority**: CRITICAL
- **Status**: PENDING

### 3. ⚙️ Antigravity Framework Configuration
- **Current**: Sviluppo locale su Windows
- **Target**: Antigravity Framework come motore principale del server Oracle
- **Action**:
  - Installare Node.js LTS su Ubuntu
  - Configurare PM2 o systemd per process management
  - Setup environment variables (.env)
  - Configurare firewall (UFW) per porte 80/443
  - Setup backup automatici
- **Priority**: CRITICAL
- **Status**: PENDING

---

## 🛠️ MIGRATION WORKFLOW

### Pre-Migration (Windows PC)
- [x] Commit finale del codice
- [ ] Rimuovere `.gemini` directory
- [ ] Verificare che tutte le dipendenze siano in `package.json`
- [ ] Creare backup completo del database Supabase
- [ ] Documentare tutte le variabili d'ambiente necessarie

### Migration (Oracle Ubuntu)
- [ ] Provisioning server Oracle Cloud
- [ ] Installazione Ubuntu LTS
- [ ] Setup utente non-root con sudo
- [ ] Installazione Node.js, npm, git
- [ ] Clone repository da GitHub
- [ ] Installazione dipendenze (`npm install`)
- [ ] Configurazione `.env` con credenziali production
- [ ] Setup Nginx/Caddy come reverse proxy
- [ ] Configurazione SSL con Let's Encrypt
- [ ] Setup PM2 per auto-restart
- [ ] Configurazione firewall

### Post-Migration
- [ ] Update DNS records
- [ ] Verifica funzionamento completo
- [ ] Test Race App su mobile
- [ ] Test Admin Dashboard
- [ ] Verifica Supabase connectivity
- [ ] Setup monitoring (logs, uptime)
- [ ] Configurazione backup automatici

---

## 📝 NOTES

**Codice da questo punto in avanti:**
- Deve essere compatibile con ambiente Linux/Ubuntu
- Evitare path Windows-specific (es: `C:\...`)
- Usare sempre path relativi o variabili d'ambiente
- Testare compatibilità cross-platform

**Environment Variables Required:**
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
NODE_ENV=production
PORT=3000
```

**Server Requirements:**
- Ubuntu 22.04 LTS or newer
- Node.js 18.x LTS or newer
- Nginx 1.18+ or Caddy 2.x
- PM2 for process management
- UFW firewall configured
- SSL certificate (Let's Encrypt)

---

**Last Updated**: 2026-02-01 03:26:07  
**Status**: READY FOR MIGRATION  
**Next Step**: Provisioning Oracle Cloud Instance
