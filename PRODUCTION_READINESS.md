# 🚀 Production Readiness Checklist - FortiFlow

## ✅ Modifications Effectuées

### 1. Architecture Tauri Simplifiée
**Changements:**
- ✅ Supprimé le backend local embarqué de Tauri
- ✅ Application se connecte directement au backend cloud (VPS)
- ✅ Simplifié [lib.rs](frontend/src-tauri/src/lib.rs) - Plus de gestion de process Python
- ✅ Retiré `port_scanner` des dépendances Cargo
- ✅ Retiré le dossier `backend` des ressources bundled

**Résultat:** Application Tauri plus légère (~50MB de moins) et démarrage instantané

### 2. Configuration Email avec SendGrid
**Nouveaux fichiers:**
- ✅ [email_utils.py](backend/email_utils.py) - Support SendGrid + fallback console
- ✅ HTML emails professionnels avec branding FortiFlow
- ✅ Variables d'environnement dans [.env.example](backend/.env.example)

**Variables d'environnement requises:**
```bash
USE_REAL_EMAIL=true
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@fortiflow.com
FRONTEND_URL=http://72.61.166.22  # ou votre domaine
```

### 3. URLs de Vérification Email
**Avant:** `http://localhost:5173/verify-email?token=xxx`
**Après:** Variable `FRONTEND_URL` configurable

**Pour production Tauri:**
- Les liens pointent vers une page web (pas `tauri://`)
- L'utilisateur clique sur l'email, ouvre son navigateur
- Après vérification web, retour à l'app Tauri

### 4. Auto-Play Feature
**Nouveau:** Option pour enchainer les steps automatiquement
- ✅ Toggle dans l'écran preview
- ✅ Activé par défaut
- ✅ Indicateur visuel pendant l'exécution

## 📋 Checklist de Déploiement

### Étape 1: Configuration SendGrid (une fois)
1. Créer un compte SendGrid (gratuit jusqu'à 100 emails/jour)
2. Obtenir une API Key: https://app.sendgrid.com/settings/api_keys
3. Vérifier un sender email (FROM_EMAIL)

### Étape 2: Mise à jour du VPS
```bash
# 1. Se connecter au VPS
ssh root@72.61.166.22

# 2. Aller dans le dossier backend
cd /opt/fortiflow/backend

# 3. Créer/mettre à jour le fichier .env
nano .env
```

Ajouter ces lignes au fichier `.env`:
```bash
# Email Configuration
USE_REAL_EMAIL=true
SENDGRID_API_KEY=SG.votre_vraie_api_key_ici
FROM_EMAIL=noreply@fortiflow.com
FRONTEND_URL=http://72.61.166.22
```

```bash
# 4. Sauvegarder (Ctrl+O, Enter, Ctrl+X)

# 5. Mettre à jour les fichiers backend
exit  # Retour sur votre machine locale
cd /chemin/vers/fortiflow
./backend/deploy.sh  # Script de déploiement automatique

# OU manuellement:
rsync -avz --exclude='venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='fortiflow.db' --exclude='tests' backend/ root@72.61.166.22:/opt/fortiflow/backend/

# 6. Rebuild les containers Docker
ssh root@72.61.166.22
cd /opt/fortiflow/backend
docker compose down
docker compose up -d --build

# 7. Vérifier les logs
docker compose logs -f backend
```

### Étape 3: Vérifier les migrations de DB
```bash
# Sur le VPS
ssh root@72.61.166.22
cd /opt/fortiflow/backend

# Accéder à la DB PostgreSQL
docker compose exec postgres psql -U fortiflow -d fortiflow

# Vérifier que les colonnes email existent
\d users

# Devrait afficher:
# - is_verified (boolean)
# - verification_token (text)
# - reset_token (text)
# - reset_token_expires (timestamp)

# Quitter
\q
```

### Étape 4: Tester l'API
```bash
# Health check
curl http://72.61.166.22/health

# Test registration (devrait envoyer un email)
curl -X POST http://72.61.166.22/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123456!"
  }'

# Vérifier les logs pour voir l'email
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs backend | grep EMAIL"
```

### Étape 5: Build de l'application Tauri Windows
```bash
cd frontend
npm install  # S'assurer que les deps sont à jour
npm run tauri:build  # Build Windows

# L'exe sera dans:
# src-tauri/target/release/bundle/msi/FortiFlow_1.0.0_x64_en-US.msi
# src-tauri/target/release/bundle/nsis/FortiFlow_1.0.0_x64-setup.exe
```

### Étape 6: Test de l'app Windows
1. Installer l'exe sur une machine Windows
2. Lancer FortiFlow
3. Créer un compte → email devrait arriver
4. Cliquer sur le lien de vérification
5. Se connecter → devrait fonctionner
6. Tester création de routine, communauté, etc.

## 🔧 Configuration Frontend URLs

Le frontend utilise automatiquement la bonne URL selon l'environnement:

**Development:** [.env.development](frontend/.env.development)
```
VITE_API_URL=http://localhost:3000
```

**Production:** [.env.production](frontend/.env.production)
```
VITE_API_URL=http://72.61.166.22
```

## 📊 Monitoring Post-Déploiement

### Vérifier que tout fonctionne:
```bash
# 1. API Health
curl http://72.61.166.22/health

# 2. Containers en cours
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose ps"

# 3. Logs backend
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs --tail=100 backend"

# 4. Logs PostgreSQL
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs --tail=50 postgres"

# 5. Utilisation ressources
ssh root@72.61.166.22 "docker stats --no-stream"
```

## ⚠️ Problèmes Possibles et Solutions

### Email ne s'envoie pas
**Symptômes:** Console log au lieu d'email réel

**Solutions:**
1. Vérifier que `USE_REAL_EMAIL=true` dans `/opt/fortiflow/backend/.env`
2. Vérifier que `SENDGRID_API_KEY` est correct
3. Vérifier les logs: `docker compose logs backend | grep -i email`
4. Tester l'API key SendGrid via leur dashboard

### Application Tauri ne se connecte pas
**Symptômes:** Erreurs de connexion API

**Solutions:**
1. Vérifier que le VPS est accessible: `curl http://72.61.166.22/health`
2. Vérifier le firewall du VPS (port 80 ouvert)
3. Check console browser dans l'app (F12 si dev mode)

### Erreur "Table users has no column is_verified"
**Symptômes:** Erreur 500 lors de l'inscription

**Solutions:**
```bash
# Se connecter au VPS
ssh root@72.61.166.22
cd /opt/fortiflow/backend

# Accéder au container backend
docker compose exec backend bash

# Lancer le script de migration
python scripts/migrate_add_email_verification.py

# Sortir et redémarrer
exit
docker compose restart backend
```

## 📈 Prochaines Étapes (Optionnel)

### 1. Nom de domaine + HTTPS
```bash
# Acheter un domaine (ex: fortiflow.com)
# Configurer DNS A record vers 72.61.166.22
# Installer Certbot pour SSL gratuit
ssh root@72.61.166.22
apt install certbot python3-certbot-nginx
certbot --nginx -d fortiflow.com
```

### 2. Monitoring Avancé
- Uptime Robot pour alertes si API down
- Sentry pour error tracking
- PostHog pour analytics

### 3. Backup Automatique
```bash
# Sur le VPS, créer cron job
ssh root@72.61.166.22
crontab -e

# Ajouter backup quotidien à 3h
0 3 * * * cd /opt/fortiflow/backend && docker compose exec -T postgres pg_dump -U fortiflow fortiflow > /opt/fortiflow/backups/backup-$(date +\%Y\%m\%d).sql
```

## ✅ Résumé des Fichiers Modifiés

**Backend:**
- `email_utils.py` - Nouvelle implémentation SendGrid
- `requirements.txt` - Ajout `sendgrid==6.11.0`
- `.env.example` - Nouvelles variables email
- `scripts/migrate_add_email_verification.py` - Fix chemin DB

**Frontend:**
- `src-tauri/src/lib.rs` - Simplifié (plus de backend local)
- `src-tauri/Cargo.toml` - Retiré `port_scanner`
- `src-tauri/tauri.conf.json` - Retiré `resources: ["backend"]`
- `src/pages/PlayRoutine.tsx` - Ajout auto-play feature

**Documentation:**
- `PRODUCTION_READINESS.md` - Ce fichier
- `CLAUDE.md` - À mettre à jour

## 🎯 Checklist Finale Avant Release

- [ ] SendGrid configuré et testé
- [ ] Variables d'environnement VPS à jour
- [ ] Backend déployé sur VPS
- [ ] Migrations DB appliquées
- [ ] Test inscription + email de vérification
- [ ] Build Tauri Windows créé
- [ ] Test complet de l'app Windows
- [ ] Monitoring en place
- [ ] Backup configuré (optionnel)
- [ ] Documentation mise à jour
