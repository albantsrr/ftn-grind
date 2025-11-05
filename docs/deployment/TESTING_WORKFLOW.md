# Guide de Test : Dev vs Prod

Ce document explique comment tester les changements avant de les déployer en production.

---

## 🏗️ Architecture

### Vue d'ensemble

```
┌───────────────────────────────────────────────────────────────┐
│                    APPLICATION TAURI                           │
│                  (Desktop - Version finale)                    │
│                                                                 │
│      Toujours connectée à : http://72.61.166.22 (prod)        │
│                                                                 │
│      ⚠️ Pas de version "dev" de l'app Tauri                   │
└───────────────────────────────────────────────────────────────┘
                              │
                              │ API calls
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                      BACKEND API                               │
│                                                                 │
│  ┌─────────────────────┐      ┌──────────────────────┐       │
│  │   Dev Environment   │      │  Prod Environment     │       │
│  │                     │      │                        │       │
│  │ Port: 3001          │      │ Port: 80               │       │
│  │ DB: fortiflow_dev   │      │ DB: fortiflow          │       │
│  │ URL: :3001          │      │ URL: (default)         │       │
│  │                     │      │                        │       │
│  │ Pour: Tests internes│      │ Pour: Users finaux     │       │
│  └─────────────────────┘      └──────────────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

### Points clés

1. **Application Tauri** = Toujours en prod (connectée au backend prod sur port 80)
2. **Backend Dev** = Pour tester les changements d'API avant de les mettre en prod
3. **Backend Prod** = Utilisé par tous les users de l'app Tauri

---

## 🔄 Workflow Complet de Développement

### 1. Développement Local

**Environnement** : Ta machine locale

**But** : Coder et tester rapidement

```bash
# Backend local
cd backend
./run_backend.sh  # Port 3000, SQLite local

# Frontend local (navigateur web)
cd frontend
npm run dev  # Port 5173, connecté au backend local (port 3000)

# Tauri local (optionnel pour UI tests)
cd frontend
npm run tauri:dev  # Peut se connecter au backend local
```

**Tests** :
- ✅ Tests unitaires : `cd backend && pytest`
- ✅ Tests d'intégration : Tester les endpoints via Swagger (`localhost:3000/docs`)
- ✅ Tests UI : Navigateur web sur `localhost:5173`

---

### 2. Push vers GitHub

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

**Ce qui se passe automatiquement** :

#### A. Tests automatiques (3-5 min)
```
GitHub Actions → .github/workflows/test.yml

Tests:
- Backend pytest (Python 3.10, 3.11, 3.12)
- Frontend lint + build
```

**Résultat** :
- ✅ Tests passent → Continue
- ❌ Tests échouent → Stop (pas de déploiement)

#### B. Déploiement Dev automatique (2-3 min)
```
GitHub Actions → .github/workflows/deploy-dev.yml

Actions:
1. SSH vers VPS
2. cd /opt/fortiflow/dev
3. git pull origin main
4. docker compose -f docker-compose.dev.yml up -d --build
5. Health check sur http://localhost:3001/health
```

**Résultat** : Backend dev mis à jour automatiquement

---

### 3. Tests sur Backend Dev

**Environnement** : VPS, environnement dev isolé

**URL** : `http://72.61.166.22:3001`

**But** : Vérifier que les changements d'API fonctionnent en conditions réelles (PostgreSQL, Docker, etc.)

#### Option A : Tests via Swagger UI

```bash
# Ouvrir dans le navigateur
http://72.61.166.22:3001/docs

# Tester les endpoints manuellement
```

#### Option B : Tests via l'interface web

```bash
# Sur ta machine locale
cd frontend

# Créer .env.development pour pointer vers dev
echo "VITE_API_URL=http://72.61.166.22:3001" > .env.development

# Lancer le frontend local connecté au backend dev
npm run dev

# Ouvrir http://localhost:5173
# L'interface web sera connectée au backend dev
```

#### Option C : Tests via curl/Postman

```bash
# Health check
curl http://72.61.166.22:3001/health

# Register
curl -X POST http://72.61.166.22:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Test123!","full_name":"Test User"}'

# Login
curl -X POST http://72.61.166.22:3001/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@test.com&password=Test123!"
```

**Ce qu'on teste** :
- ✅ Nouveaux endpoints fonctionnent
- ✅ Migrations de base de données OK
- ✅ Pas de régression sur endpoints existants
- ✅ Performances acceptables

---

### 4. Validation et décision

**Questions à se poser** :

- [ ] Tous les tests dev passent ?
- [ ] Les nouveaux endpoints fonctionnent correctement ?
- [ ] Pas de bugs critiques détectés ?
- [ ] Les logs ne montrent pas d'erreurs ?

**Si OUI** → Passer en prod ✅
**Si NON** → Fix les bugs, re-push, re-test sur dev ❌

---

### 5. Déploiement Production (Manuel)

**Environnement** : VPS, environnement prod

**URL** : `http://72.61.166.22` (port 80)

**But** : Mettre à jour le backend utilisé par tous les users de l'app Tauri

#### Étapes

1. **Aller sur GitHub Actions**
   ```
   https://github.com/albantsrr/ftn-grind/actions
   ```

2. **Sélectionner "Deploy to Production"**

3. **Cliquer "Run workflow"**

4. **Confirmer en tapant : `deploy`**

5. **Cliquer "Run workflow"**

**Ce qui se passe automatiquement** :
```
1. ✅ Validation confirmation
2. 📦 Backup PostgreSQL dans /opt/fortiflow/backups/
3. 🚀 Déploiement (git pull + docker restart)
4. 🏥 Health check (5 tentatives avec retry)
5. ✅ Success → Notification
   OU
   ❌ Fail → Instructions rollback
```

**Durée** : ~4-6 minutes

---

### 6. Vérification Production

**Tests rapides** :

```bash
# Health check
curl http://72.61.166.22/health

# Swagger UI
http://72.61.166.22/docs

# Tester avec l'app Tauri
# Ouvrir l'app desktop → Essayer de se connecter/créer compte
```

**Monitoring** :

```bash
# Voir les logs en temps réel
ssh root@72.61.166.22
cd /opt/fortiflow/prod/backend
docker compose logs -f backend

# Voir l'état des services
docker compose ps
```

---

## 📊 Tableau récapitulatif

| Environnement | URL | Port | Base de données | Utilisé par | But |
|---------------|-----|------|-----------------|-------------|-----|
| **Local** | localhost:3000 | 3000 | SQLite (local) | Toi (dev) | Développement rapide |
| **Dev VPS** | 72.61.166.22:3001 | 3001 | PostgreSQL (fortiflow_dev) | Toi (tests) | Tests avant prod |
| **Prod VPS** | 72.61.166.22 | 80 | PostgreSQL (fortiflow) | Tous les users | Production finale |

---

## 🧪 Cas d'usage réels

### Cas 1 : Ajouter un nouveau endpoint

```
1. Code l'endpoint localement (backend/routers/xxx.py)
2. Teste localement avec pytest
3. Push vers GitHub
4. Tests auto passent → Deploy dev auto
5. Teste l'endpoint sur dev (curl ou Swagger)
6. Si OK → Deploy prod manuellement
7. App Tauri utilise automatiquement le nouvel endpoint
```

### Cas 2 : Modifier un modèle de base de données

```
1. Modifie models.py localement
2. Crée un script de migration (backend/scripts/migrate_xxx.py)
3. Teste localement avec SQLite
4. Push vers GitHub
5. Deploy dev auto
6. SSH vers dev → Lance la migration :
   cd /opt/fortiflow/dev/backend
   docker compose exec backend python scripts/migrate_xxx.py
7. Teste que les données sont OK sur dev
8. Si OK → Deploy prod + lance migration sur prod
```

### Cas 3 : Changer l'UI Frontend (pas d'impact backend)

```
1. Modifie le frontend localement
2. Teste avec npm run dev
3. Push vers GitHub
4. Tests auto passent (lint + build)
5. Pas besoin de tester sur backend dev (aucun changement d'API)
6. Build la nouvelle version Tauri :
   cd frontend
   npm run tauri:build
7. Créer une release GitHub avec l'exécutable
8. Les users téléchargent la nouvelle version
```

---

## ❌ Erreurs courantes

### Erreur 1 : "Je veux tester l'app Tauri sur dev"

**Problème** : Il n'y a pas de "version dev" de l'app Tauri

**Solution** : Teste le backend dev via Swagger ou interface web locale connectée à dev

---

### Erreur 2 : "J'ai déployé en prod mais l'app ne voit pas les changements"

**Possible cause 1** : L'app Tauri utilise une ancienne version de l'API

**Solution** : Vérifie que le backend prod est bien à jour :
```bash
curl http://72.61.166.22/health
ssh root@72.61.166.22 "cd /opt/fortiflow/prod && git log --oneline -5"
```

**Possible cause 2** : Changements côté frontend uniquement

**Solution** : Les users doivent télécharger la nouvelle version de l'app Tauri

---

### Erreur 3 : "Le backend dev fonctionne mais pas prod"

**Causes possibles** :
- `.env` différent entre dev et prod (variables manquantes)
- Base de données prod nécessite migration
- Différence de configuration Docker

**Solution** :
```bash
# Comparer les logs
ssh root@72.61.166.22
cd /opt/fortiflow/dev/backend && docker compose logs --tail=30 backend_dev
cd /opt/fortiflow/prod/backend && docker compose logs --tail=30 backend

# Comparer les .env (sans afficher les secrets!)
cd /opt/fortiflow/dev/backend && cat .env | grep -v "SECRET\|KEY\|PASSWORD"
cd /opt/fortiflow/prod/backend && cat .env | grep -v "SECRET\|KEY\|PASSWORD"
```

---

## 🎯 Résumé en une image

```
┌──────────────┐
│   Code       │
│   Localement │
└──────┬───────┘
       │
       ↓ git push
┌──────────────┐
│   GitHub     │
│   Actions    │
└──────┬───────┘
       │
       ├─→ Tests auto (3-5 min)
       │   └─→ ✅ Passent
       │
       ├─→ Deploy Dev auto (2-3 min)
       │   └─→ Backend Dev mis à jour
       │
       ├─→ Tests manuels sur Dev
       │   └─→ Swagger, curl, ou web UI
       │
       └─→ Si OK → Deploy Prod manuel (1 clic)
           └─→ Backend Prod mis à jour
               └─→ App Tauri utilise automatiquement
```

---

## 🔧 Commandes utiles

### Vérifier l'état de chaque environnement

```bash
# Local
curl http://localhost:3000/health

# Dev
curl http://72.61.166.22:3001/health

# Prod
curl http://72.61.166.22/health
```

### Voir les logs

```bash
# Dev
ssh root@72.61.166.22 "cd /opt/fortiflow/dev/backend && docker compose -f docker-compose.dev.yml logs --tail=50 backend_dev"

# Prod
ssh root@72.61.166.22 "cd /opt/fortiflow/prod/backend && docker compose logs --tail=50 backend"
```

### Vérifier la version déployée

```bash
# Dev
ssh root@72.61.166.22 "cd /opt/fortiflow/dev && cat version.json"

# Prod
ssh root@72.61.166.22 "cd /opt/fortiflow/prod && cat version.json"
```

---

**Questions ? Consulte [WORKFLOW_IMPROVEMENTS_PHASE2.md](../../WORKFLOW_IMPROVEMENTS_PHASE2.md) pour plus de détails sur le CI/CD.**
