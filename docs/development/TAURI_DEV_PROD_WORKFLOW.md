# Workflow Tauri : Dev vs Prod

Ce document explique le workflow de développement avec l'app Tauri.

---

## 🎯 Configuration actuelle

### Environnements

| Mode | Commande | Backend utilisé | Port | Base de données |
|------|----------|-----------------|------|-----------------|
| **Dev** | `npm run tauri:dev` | VPS Dev | 3001 | PostgreSQL (fortiflow_dev) |
| **Prod** | `npm run tauri:build` | VPS Prod | 80 | PostgreSQL (fortiflow) |

---

## 📁 Fichiers de configuration

### `.env.development` (Mode dev)
```bash
# Development Environment
# Uses VPS dev backend (port 3001)

VITE_API_URL=http://72.61.166.22:3001
```

### `.env.production` (Mode prod)
```bash
# Production Environment
# Uses VPS prod backend (port 80)

VITE_API_URL=http://72.61.166.22
```

---

## 🔄 Workflow de développement complet

### 1. Développement local (Code)

```bash
cd /home/banal/ftn-grind
```

**Travailler sur le code** :
- Frontend : `frontend/src/`
- Backend : `backend/`

---

### 2. Tests backend locaux (Optionnel)

Si tu veux tester rapidement des changements backend sans déployer :

```bash
cd backend
./run_backend.sh  # Port 3000, SQLite local

# Dans un autre terminal
cd frontend
npm run dev  # Frontend web sur http://localhost:5173
```

**Cas d'usage** : Tests rapides d'endpoints, modifications de modèles, etc.

---

### 3. Push vers GitHub

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

**Ce qui se passe automatiquement** :
1. ✅ **Tests automatiques** (GitHub Actions) - 3-5 min
   - Backend : pytest sur Python 3.10/3.11/3.12
   - Frontend : lint + build

2. ✅ **Déploiement dev automatique** (GitHub Actions) - 2-3 min
   - SSH vers VPS
   - `git pull` dans `/opt/fortiflow/dev`
   - Restart Docker dev (port 3001)
   - Health check

**Résultat** : Backend dev mis à jour sur `http://72.61.166.22:3001`

---

### 4. Test avec l'app Tauri en mode dev

**C'est ici que tu testes ton app avec le backend dev !**

```bash
cd /home/banal/ftn-grind/frontend
npm run tauri:dev
```

**Ce que ça fait** :
- ✅ Démarre le frontend Vite en mode dev
- ✅ Lance l'app Tauri desktop
- ✅ **Se connecte automatiquement au backend dev** (`http://72.61.166.22:3001`)
- ✅ Ouvre les DevTools pour débugger

**Tests à faire** :
- [ ] Créer un compte
- [ ] Se connecter
- [ ] Créer/modifier une routine
- [ ] Tester les nouvelles fonctionnalités
- [ ] Vérifier qu'il n'y a pas d'erreurs dans la console

**Avantages du mode dev** :
- ✅ Hot reload : les changements frontend sont instantanés
- ✅ DevTools accessibles (F12)
- ✅ Backend dev isolé (tu ne casses pas la prod)
- ✅ Base de données de test séparée

---

### 5. Si tout fonctionne en dev → Déployer en prod

Une fois que l'app dev fonctionne parfaitement :

#### A. Déployer le backend en prod

```bash
# Option 1 : Via GitHub Actions (recommandé)
# - Va sur GitHub → Actions
# - Sélectionne "Deploy to Production"
# - Run workflow → Tape "deploy" pour confirmer

# Option 2 : Manuellement
./scripts/deploy-prod-simple.sh
```

**Ce qui se passe** :
- 📦 Backup automatique de la base PostgreSQL prod
- 🚀 `git pull` dans `/opt/fortiflow/prod`
- 🔄 Restart Docker prod (port 80)
- 🏥 Health check
- ✅ Backend prod mis à jour sur `http://72.61.166.22`

---

#### B. Builder la nouvelle version Tauri

```bash
cd /home/banal/ftn-grind/frontend
npm run tauri:build
```

**Ce qui se passe** :
- ✅ Build production du frontend (avec `VITE_API_URL=http://72.61.166.22`)
- ✅ Compilation de l'exécutable Tauri
- ✅ Création des installeurs Windows (MSI + EXE)

**Résultat** : Fichiers dans `frontend/src-tauri/target/release/bundle/`

---

#### C. Créer une release GitHub

```bash
# Bump version
./scripts/prepare-release.sh 1.1.0

# Ça créera automatiquement :
# - Mise à jour de version.json
# - Sync vers package.json, tauri.conf.json, Cargo.toml
# - Commit + tag + push

# GitHub Actions créera automatiquement la release avec les binaires
```

**Résultat** : Release publiée sur GitHub avec installeurs Windows

---

## 📊 Schéma récapitulatif

```
┌─────────────────────────────────────────────────────────────┐
│                      Code Local                              │
│                                                               │
│  Frontend: src/                                              │
│  Backend: backend/                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ git push
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions                             │
│                                                               │
│  Tests auto (3-5 min) → Deploy dev auto (2-3 min)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│               VPS Dev (72.61.166.22:3001)                    │
│                                                               │
│  Backend mis à jour automatiquement                          │
│  DB: fortiflow_dev                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ npm run tauri:dev
┌─────────────────────────────────────────────────────────────┐
│              App Tauri Dev (Sur ton PC)                      │
│                                                               │
│  Se connecte à http://72.61.166.22:3001                     │
│  DevTools accessibles                                        │
│  Tests en conditions réelles                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Si OK
┌─────────────────────────────────────────────────────────────┐
│               Deploy Prod (Manuel)                           │
│                                                               │
│  GitHub Actions ou script deploy-prod-simple.sh             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│               VPS Prod (72.61.166.22:80)                     │
│                                                               │
│  Backend prod mis à jour                                     │
│  DB: fortiflow                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ npm run tauri:build
┌─────────────────────────────────────────────────────────────┐
│            Release GitHub (Automatique)                      │
│                                                               │
│  Binaires Windows (MSI + EXE)                               │
│  Users téléchargent la nouvelle version                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Commandes rapides

### Développement quotidien

```bash
# 1. Coder
cd /home/banal/ftn-grind

# 2. Push
git add .
git commit -m "feat: ..."
git push

# 3. Attendre deploy dev auto (check GitHub Actions)

# 4. Tester avec Tauri dev
cd frontend
npm run tauri:dev
```

### Déploiement production

```bash
# 1. Vérifier que dev fonctionne

# 2. Déployer backend prod
# GitHub → Actions → Deploy to Production → "deploy"

# 3. Build nouvelle version Tauri
cd frontend
npm run tauri:build

# 4. Créer release
./scripts/prepare-release.sh 1.1.0
```

---

## 🐛 Troubleshooting

### Erreur : "Failed to parse version for crate tauri-plugin-xxx"

**Cause** : Version incomplète dans `Cargo.toml`

**Fix** : Les versions doivent être au format `"2.0"` et non `"2"`

```toml
tauri-plugin-log = "2.0"  # ✅ Correct
tauri-plugin-log = "2"    # ❌ Incorrect
```

---

### Erreur : "Failed to fetch" dans l'app Tauri

**Cause possible 1** : Mauvaise URL backend

**Fix** : Vérifier `.env.development` ou `.env.production`

**Cause possible 2** : Backend dev/prod pas démarré

**Fix** :
```bash
# Vérifier backend dev
curl http://72.61.166.22:3001/health

# Vérifier backend prod
curl http://72.61.166.22/health
```

**Cause possible 3** : Firewall Windows bloque les requêtes

**Fix** : Autoriser FortiFlow dans le pare-feu Windows

---

### L'app Tauri dev ne démarre pas

**Cause** : Node.js version incompatible

**Fix** :
```bash
node --version  # Doit être 20.19+ ou 22.12+
# Si nécessaire : installer une version compatible
```

---

### Les changements ne sont pas visibles dans l'app dev

**Cause** : Cache ou hot reload ne fonctionne pas

**Fix** :
```bash
# Arrêter l'app (Ctrl+C)
# Nettoyer
cd frontend
rm -rf dist node_modules/.vite

# Relancer
npm run tauri:dev
```

---

## 💡 Best Practices

### 1. Toujours tester en dev avant prod

```
Code → Push → Deploy dev auto → Test Tauri dev → Deploy prod
```

Ne **jamais** sauter l'étape de test Tauri dev !

---

### 2. Vérifier les logs backend dev pendant les tests

```bash
# Pendant que tu testes l'app Tauri dev
ssh root@72.61.166.22 "cd /opt/fortiflow/dev/backend && docker compose -f docker-compose.dev.yml logs -f backend_dev"
```

Cela te permet de voir les erreurs backend en temps réel.

---

### 3. Utiliser les DevTools en mode dev

Dans l'app Tauri dev, appuie sur **F12** pour ouvrir les DevTools :
- **Console** : Voir les erreurs JavaScript/TypeScript
- **Network** : Voir les requêtes API (status, payload, response)
- **Application** : Voir localStorage, tokens, etc.

---

### 4. Tester les cas d'erreur

Ne teste pas seulement le happy path ! Teste aussi :
- Connexion avec mauvais mot de passe
- Création d'une routine sans nom
- Upload d'une image trop grande
- Perte de connexion internet
- Etc.

---

## 🎯 Résumé

### Mode Dev (tauri:dev)
- **Backend** : http://72.61.166.22:3001
- **Base** : fortiflow_dev
- **Usage** : Tests quotidiens
- **DevTools** : Accessibles
- **Hot reload** : Oui

### Mode Prod (tauri:build)
- **Backend** : http://72.61.166.22
- **Base** : fortiflow
- **Usage** : Release finale pour users
- **DevTools** : Non
- **Hot reload** : Non

---

**Maintenant tu as un workflow dev/prod complet et professionnel ! 🚀**
