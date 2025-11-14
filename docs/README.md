# 📚 FortiFlow - Documentation Principale

## 🎯 Présentation du Projet

FortiFlow est une application desktop de coaching pour joueurs Fortnite, conçue pour structurer et optimiser les sessions d'entraînement.

### Concept
L'application permet aux joueurs de créer des **routines d'entraînement personnalisées** composées d'exercices chronométrés sur différentes maps créatives Fortnite. Chaque routine guide le joueur étape par étape avec :
- Un timer précis pour chaque exercice
- Des alertes sonores entre les étapes
- Des instructions et tips affichés à l'écran
- Un suivi de progression (statistiques, streaks, grades)

### Vision Produit
FortiFlow ambitionne de devenir **le coach numérique des joueurs Fortnite compétitifs**, en apportant structure, discipline et motivation dans leurs sessions d'entraînement.

---

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend**
- React 19 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router (navigation)

**Backend**
- FastAPI (Python 3.10-3.12)
- SQLAlchemy ORM
- SQLite (dev) / PostgreSQL (prod)
- JWT authentication (python-jose + bcrypt)

**Desktop**
- Tauri v2 (Rust)
- Application native multiplateforme
- Connexion au backend cloud (VPS)

**Infrastructure**
- VPS: 72.61.166.22 (PostgreSQL + FastAPI + Nginx via Docker)
- CI/CD: GitHub Actions (build Windows + auto-déploiement)
- Distribution: GitHub Releases avec auto-update Tauri

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js v18 ou v20 LTS
- Rust (pour builds Tauri) via rustup
- **Note:** Pas besoin de Python localement, le backend est sur le VPS

### Backend (API FastAPI sur VPS)
Le backend est hébergé sur le VPS et accessible à :
- API: `http://72.61.166.22`
- Documentation interactive: `http://72.61.166.22/docs`
- Health check: `http://72.61.166.22/health`

**Déploiement backend** (pour les mainteneurs) :
```bash
cd backend
./scripts/deploy-backend.sh  # Déploie sur le VPS
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Interface disponible sur `http://localhost:5173`

### Application Desktop (Tauri)
```bash
cd frontend
npm run tauri:dev   # Mode développement
npm run tauri:build # Build production
```

---

## 🎮 Fonctionnalités Principales

### Gestion des Routines
- **Création** : Formulaire avec nom, image, type de son, volume
- **Étapes** : Ajout d'exercices avec nom, code map, durée, tips
- **Édition** : Modification complète des routines existantes
- **Suppression** : Avec confirmation
- **Exécution** : Timer intégré avec bips, pause/reprise, navigation

### Système de Comptes
- **Authentification** : JWT avec refresh tokens
- **Inscription/Connexion** : Email + mot de passe
- **Vérification email** : Tokens d'activation SendGrid
- **Réinitialisation mot de passe** : Flow complet par email

### Abonnements (Stripe)
- **Free** : 2 routines max, fonctionnalités de base
- **Premium (3,99€/mois)** :
  - Routines illimitées
  - Accès communauté
  - Statistiques avancées
  - Classements (leaderboard)

### Communauté (Premium)
- **Partage** : Publication de routines publiques
- **Tags** : Catégorisation (Aim, Edit, Build, etc.)
- **Ratings** : Système de notation 1-5 étoiles
- **Recherche** : Filtres par tags, tri par popularité/date

### Statistiques (Premium)
- **Sessions** : Tracking de chaque entraînement
- **Grades** : Système de progression (Bronze → Legend)
- **Streaks** : Compteur de jours consécutifs
- **Charts** : Graphiques de sessions/routines/temps
- **Leaderboard** : Classement global et amis

---

## 📊 Modèle de Données

### Schéma Principal

**users**
- Authentification : email, username, hashed_password
- Vérification : is_verified, verification_token
- Abonnement : subscription_tier, trial_ends_at
- Reset password : reset_token, reset_token_expires

**routines** (champs en français)
- Métadonnées : nom, date, sound_type, volume, image_url
- Social : is_public, author_name, average_rating, total_ratings
- Relations : user_id (FK), routine_steps (1-N), routine_tags (N-N)

**routine_steps**
- Contenu : nom, code_map, duree, tips, order
- Cascade delete : supprimés avec la routine

**subscriptions** (Stripe sync)
- Identifiants : stripe_customer_id, stripe_subscription_id
- Status : subscription_status (free/active/canceled/past_due)
- Périodes : current_period_start, current_period_end

**routine_sessions** (stats)
- Tracking : started_at, completed_at, total_duration, completed
- Relations : user_id, routine_id

**tags**
- Données : nom, color (hex)
- 8 tags par défaut : Aim, Edit, Build, Box Fight, Zone Wars, Realiste, Deathrun, Parkour

**routine_ratings**
- Notation : rating (1-5)
- Contrainte : unique (user_id, routine_id)

---

## 🌍 Déploiement

### Environnement

**Backend VPS (Unique)**
- Backend : `http://72.61.166.22` (PostgreSQL + Docker)
- Services : Nginx (reverse proxy) + FastAPI + PostgreSQL
- Utilisé par toutes les instances (dev et prod)

**Frontend**
- Dev : `http://localhost:5173` (Vite dev server)
- Tauri (dev et prod) : Se connecte au VPS backend

### Déploiement Backend

**Script Automatique**
```bash
cd backend
./scripts/deploy-backend.sh
```

**Actions du script :**
1. Sync fichiers via rsync (exclut venv, tests, .env)
2. Rebuild containers Docker
3. Restart services
4. Health check
5. Affichage logs

**Vérification manuelle**
```bash
ssh root@72.61.166.22
cd /opt/fortiflow/backend
docker compose ps
docker compose logs -f backend
```

### Release Desktop

**Automatique (recommandé)**
```bash
./scripts/prepare-release.sh 1.2.0
git push --tags
```

**GitHub Actions :**
- Détecte le tag `v*.*.*`
- Build Windows (MSI + EXE)
- Upload sur GitHub Releases
- Génération fichier update.json (Tauri auto-updater)

---

## 🧪 Tests

### Framework
- pytest + pytest-asyncio + pytest-cov
- FastAPI TestClient avec httpx
- Coverage HTML dans `htmlcov/`

### Commandes
```bash
cd backend
source venv/bin/activate

pytest                                    # Tous les tests
pytest tests/test_auth.py                 # Fichier spécifique
pytest -v -s                              # Verbose + print statements
pytest --cov=. --cov-report=html          # Rapport HTML
pytest --cov=. --cov-report=term-missing  # Rapport terminal
```

### Carte de Test Stripe
```
Numéro : 4242 4242 4242 4242
Date : N'importe quelle date future
CVC : N'importe quel 3 chiffres
```

---

## 🔧 Configuration

### Variables d'Environnement Backend

**Obligatoires**
```bash
SECRET_KEY=your-secret-key-here  # JWT signing
```

**Email (optionnel)**
```bash
USE_REAL_EMAIL=false
SENDGRID_API_KEY=sg_xxx
FROM_EMAIL=noreply@fortiflow.com
FRONTEND_URL=http://localhost:5173
```

**Stripe (requis pour subscriptions)**
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx
```

**Base de données**
```bash
# Dev (défaut)
DATABASE_URL=sqlite:///./fortiflow.db

# Prod
DATABASE_URL=postgresql://user:pass@host:5432/fortiflow
```

### Fichiers de Config Frontend
- `.env.development` : `VITE_API_URL=http://72.61.166.22:3001` (VPS backend dev)
- `.env.production` : `VITE_API_URL=http://72.61.166.22` (VPS backend prod)

---

## 📖 Ressources Complémentaires

### Documentation Technique
- **Utils.md** : Guide pédagogique complet sur l'infrastructure
- **Update.md** : Journal des modifications de la session

### Documentation Externe
- Tauri : https://tauri.app/v2/guides/
- FastAPI : https://fastapi.tiangolo.com/
- Stripe API : https://stripe.com/docs/api

---

## 🐛 Dépannage

### Backend ne démarre pas
- Vérifier version Python : `python --version` (3.10-3.12)
- Vérifier SECRET_KEY dans `.env`
- Port 3000 occupé : `lsof -ti:3000 | xargs kill -9`

### Frontend ne se connecte pas
- Vérifier backend actif : `curl http://72.61.166.22/health`
- Vérifier variable VITE_API_URL dans .env files
- Console navigateur : erreurs CORS ?

### Erreurs de base de données
- Lancer migrations : `python scripts/migrate_*.py`
- Si échec : backup + supprimer `fortiflow.db` + restart

### Build Tauri échoue
- Vérifier Rust : `rustc --version`
- Clear cache : `rm -rf src-tauri/target`
- Vérifier Node : `node --version` (v18/v20)

---

## 👤 Contact & Contribution

**Développeur Principal**
- Alban Teissier
- Email : alban.teissier.dev@gmail.com
- LinkedIn : [albanteissier](https://www.linkedin.com/in/albanteissier/)

**Liens Projet**
- GitHub : https://github.com/albantsrr/ftn-grind
- Download : https://albantsrr.github.io/ftn-grind/

---

*FortiFlow – Master your flow. Map by map.*
