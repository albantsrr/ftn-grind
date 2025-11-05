# Configuration VPS Simplifiée - Mode Git

Cette approche est **beaucoup plus simple** : on utilise Git directement sur le VPS !

## 🎯 Principe

```
Local → git push → GitHub → git pull sur VPS → restart
```

Pas de rsync, pas de copie manuelle, juste Git.

---

## 🚀 Setup Initial (Une seule fois)

### 1. Sur le VPS - Setup de la structure Git

```bash
# Se connecter au VPS
ssh root@72.61.166.22

# Créer la structure
mkdir -p /opt/fortiflow/{dev,prod}

# Setup environnement PROD
cd /opt/fortiflow/prod

# Si tu as déjà des fichiers, backup
mv /opt/fortiflow/backend /opt/fortiflow/backend.backup

# Clone le repo GitHub
git clone https://github.com/YOUR_USERNAME/ftn-grind.git .
# Ou si tu utilises SSH:
# git clone git@github.com:YOUR_USERNAME/ftn-grind.git .

# Créer le fichier .env (secrets)
nano backend/.env
```

### 2. Créer le fichier `.env` sur le VPS

Copie ce template dans `backend/.env` :

```bash
# Security (REQUIRED)
SECRET_KEY=votre-secret-key-production-ici

# Email
USE_REAL_EMAIL=true
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@fortiflow.com
FRONTEND_URL=http://72.61.166.22

# Stripe (Production keys)
STRIPE_SECRET_KEY=sk_live_...  # Utilise sk_test_ si tu testes
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Database
POSTGRES_USER=fortiflow
POSTGRES_PASSWORD=un-mot-de-passe-tres-securise
POSTGRES_DB=fortiflow
```

**⚠️ Génération SECRET_KEY sécurisée :**
```bash
# Sur le VPS, génère une clé aléatoire :
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Lancer la prod

```bash
cd /opt/fortiflow/prod/backend
docker compose up -d

# Vérifier
docker compose ps
curl http://localhost:80/health
```

### 4. Setup environnement DEV (optionnel)

```bash
# Sur le VPS
cd /opt/fortiflow/dev
git clone https://github.com/YOUR_USERNAME/ftn-grind.git .

# Créer .env pour dev (avec des valeurs différentes)
nano backend/.env
# Copier le template mais changer :
# - SECRET_KEY (différente de prod!)
# - POSTGRES_DB=fortiflow_dev
# - USE_REAL_EMAIL=false
# - Utiliser clés Stripe de test (sk_test_...)

# Lancer
cd /opt/fortiflow/dev/backend
docker compose -f docker-compose.dev.yml up -d
```

---

## 🔄 Workflow de déploiement simplifié

### Déploiement Production

```bash
# 1. Sur ta machine locale - Push tes changements
git add .
git commit -m "feat: nouvelle feature"
git push

# 2. Sur le VPS - Pull et redémarrer
ssh root@72.61.166.22 << 'ENDSSH'
cd /opt/fortiflow/prod
git pull origin main
cd backend
docker compose down
docker compose up -d --build
docker compose logs -f backend
ENDSSH
```

### Ou en une seule commande depuis ton local :

Crée ce script : `scripts/deploy-prod.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying to production VPS..."

# Pull latest changes on VPS
ssh root@72.61.166.22 << 'ENDSSH'
cd /opt/fortiflow/prod
echo "📥 Pulling latest changes..."
git pull origin main

cd backend
echo "🔄 Restarting services..."
docker compose down
docker compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

echo "🏥 Health check..."
curl -f http://localhost:80/health || exit 1

echo "✅ Deployment successful!"
docker compose ps
ENDSSH

echo "🎉 Production deployment complete!"
```

Usage :
```bash
# Depuis ta machine locale
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

---

## 🧪 Déploiement Dev (Testing)

Même principe pour le dev :

```bash
#!/bin/bash
# scripts/deploy-dev.sh
set -e

echo "🔧 Deploying to dev environment..."

ssh root@72.61.166.22 << 'ENDSSH'
cd /opt/fortiflow/dev
git pull origin main
cd backend
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
sleep 10
curl -f http://localhost:3001/health || exit 1
echo "✅ Dev deployment successful!"
ENDSSH
```

---

## 🔐 Gestion des secrets `.env`

### Problème : `.env` n'est pas dans Git (et c'est bien !)

Le fichier `.env` contient des secrets et ne doit **jamais** être versionné.

### Solutions :

#### Option 1 : Fichier `.env` persistant sur le VPS ✅ (Recommandé)

```bash
# Sur le VPS - Créer .env une fois
cd /opt/fortiflow/prod/backend
nano .env
# Coller tes secrets

# Lors des pull, Git ne touchera jamais à .env car il est ignoré
git pull  # ✅ .env reste intact
```

**Avantages** :
- ✅ Simple
- ✅ Secrets sécurisés
- ✅ Pas de risque de les perdre

**Inconvénients** :
- ⚠️ Si tu dois changer un secret, connexion SSH nécessaire

#### Option 2 : Fichier `.env.example` versionné

```bash
# Dans Git, crée backend/.env.example avec des placeholders
SECRET_KEY=changeme
POSTGRES_PASSWORD=changeme
STRIPE_SECRET_KEY=sk_test_changeme
```

```bash
# Sur le VPS, copie et édite
cp backend/.env.example backend/.env
nano backend/.env  # Remplace les valeurs
```

**Avantages** :
- ✅ Template toujours à jour dans Git
- ✅ Facile pour setup initial

#### Option 3 : Secrets dans GitHub Actions (Phase 2)

Quand on mettra en place le CI/CD, on pourra stocker les secrets dans GitHub et les déployer automatiquement.

---

## 🔄 Workflow complet (Local → Git → VPS)

```
┌──────────────┐
│   Local Dev  │
│              │
│ 1. Code      │
│ 2. Test      │
│ 3. Commit    │
│ 4. Push      │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   GitHub     │  ← Repository central
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   VPS Prod   │
│              │
│ git pull     │  ← Une commande !
│ restart      │
└──────────────┘
```

---

## 📊 Comparaison : Ancien vs Nouveau

### Ancien workflow (rsync)
```bash
# Complexe, beaucoup d'étapes :
rsync -avz --exclude='venv' --exclude='__pycache__' \
      --exclude='*.pyc' --exclude='fortiflow.db' \
      --exclude='tests' --exclude='.env' \
      ./backend/ root@72.61.166.22:/opt/fortiflow/backend/

ssh root@72.61.166.22 "cd /opt/fortiflow/backend && \
    docker compose down && docker compose up -d --build"
```

**Problèmes** :
- ❌ Pas de traçabilité des versions
- ❌ Risque de sync partiel
- ❌ Pas d'historique
- ❌ Compliqué

### Nouveau workflow (Git)
```bash
# Simple, une commande :
./scripts/deploy-prod.sh
```

Ou manuellement :
```bash
ssh root@72.61.166.22
cd /opt/fortiflow/prod
git pull && cd backend && docker compose restart
```

**Avantages** :
- ✅ Traçabilité complète (via Git)
- ✅ Rollback facile (`git checkout v1.0.0`)
- ✅ Historique des déploiements
- ✅ Simple et standard

---

## 🛠️ Commandes utiles

### Voir la version déployée
```bash
ssh root@72.61.166.22
cd /opt/fortiflow/prod
git log --oneline -5  # 5 derniers commits
cat version.json  # Version actuelle
```

### Rollback à une version précédente
```bash
ssh root@72.61.166.22
cd /opt/fortiflow/prod

# Voir les versions disponibles
git tag

# Rollback à v1.0.0 par exemple
git checkout v1.0.0

# Restart
cd backend && docker compose restart

# Revenir à la dernière version
git checkout main
cd backend && docker compose restart
```

### Voir les différences avant de pull
```bash
ssh root@72.61.166.22
cd /opt/fortiflow/prod

# Voir ce qui a changé
git fetch
git log HEAD..origin/main --oneline

# Pull seulement si satisfait
git pull
```

---

## 🔒 Sécurité

### Accès Git sur le VPS

#### Option 1 : HTTPS (plus simple)
```bash
# Sur le VPS
git clone https://github.com/YOUR_USERNAME/ftn-grind.git
# Git demandera username/password à chaque pull
```

#### Option 2 : SSH (recommandé pour automatisation)
```bash
# Sur le VPS - Générer une clé
ssh-keygen -t ed25519 -C "vps-fortiflow"

# Afficher la clé publique
cat ~/.ssh/id_ed25519.pub

# Ajouter cette clé dans GitHub :
# GitHub → Settings → SSH and GPG keys → New SSH key

# Clone avec SSH
git clone git@github.com:YOUR_USERNAME/ftn-grind.git
```

---

## 🎉 Résumé

### Setup initial (une fois)
1. Clone le repo sur le VPS
2. Créer `.env` avec les secrets
3. Lancer Docker

### Déploiement quotidien
```bash
# Sur ton local
git push

# Sur le VPS (ou via script)
cd /opt/fortiflow/prod
git pull
cd backend && docker compose restart
```

**C'est tout ! 🎈**

---

## 💡 Prochaine étape : Automatiser avec GitHub Actions

Une fois que tu es à l'aise avec ce workflow, on pourra l'automatiser complètement :

```
git push → GitHub Actions → Auto-deploy sur VPS
```

Plus besoin de SSH manuellement ! 🚀
