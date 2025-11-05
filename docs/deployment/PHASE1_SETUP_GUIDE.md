# Phase 1: Fondations - Guide de Déploiement

Ce guide détaille comment mettre en place les fondations pour un workflow de développement fluide avec environnements de dev et prod séparés.

## ✅ Ce qui a été créé

### 1. Centralisation des versions
- **`version.json`** : Source unique de vérité pour le numéro de version
- **`scripts/sync-version.js`** : Script Node.js pour synchroniser automatiquement les versions
- **`scripts/prepare-release.sh`** : Mis à jour pour utiliser le nouveau système

### 2. Docker multi-environnements
- **`backend/docker-compose.dev.yml`** : Configuration Docker pour l'environnement de développement
- **`backend/nginx/nginx.multi-env.conf`** : Configuration Nginx pour prod + dev

## 🚀 Déploiement sur le VPS

### Étape 1: Préparer la structure sur le VPS

```bash
# Se connecter au VPS
ssh root@72.61.166.22

# Créer la structure de dossiers
mkdir -p /opt/fortiflow/dev
mkdir -p /opt/fortiflow/prod

# Copier la configuration actuelle dans prod
cp -r /opt/fortiflow/backend/* /opt/fortiflow/prod/
```

### Étape 2: Déployer l'environnement de développement

```bash
# Depuis votre machine locale
# Sync les fichiers backend vers le dossier dev
rsync -avz --exclude='venv' \
           --exclude='__pycache__' \
           --exclude='*.pyc' \
           --exclude='fortiflow.db' \
           --exclude='tests' \
           ./backend/ root@72.61.166.22:/opt/fortiflow/dev/

# Se connecter au VPS
ssh root@72.61.166.22

# Aller dans le dossier dev
cd /opt/fortiflow/dev

# Copier le fichier .env depuis prod (ou créer un nouveau)
cp /opt/fortiflow/prod/.env .env

# Optionnel: Modifier le .env pour l'environnement de dev
# Par exemple, pointer vers une base de données différente
nano .env
```

### Étape 3: Configuration des bases de données

Sur le VPS, créez un fichier `.env` pour l'environnement de dev :

```bash
# /opt/fortiflow/dev/.env

# Security
SECRET_KEY=your-dev-secret-key-different-from-prod

# Database (dev uses different database name)
POSTGRES_USER=fortiflow
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=fortiflow_dev

# Email (usually false in dev)
USE_REAL_EMAIL=false
SENDGRID_API_KEY=
FROM_EMAIL=dev@fortiflow.com
FRONTEND_URL=http://localhost:5173

# Stripe (can use test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

### Étape 4: Lancer l'environnement de développement

```bash
# Sur le VPS, dans /opt/fortiflow/dev
docker compose -f docker-compose.dev.yml up -d

# Vérifier que les containers tournent
docker compose -f docker-compose.dev.yml ps

# Vérifier les logs
docker compose -f docker-compose.dev.yml logs -f backend_dev
```

### Étape 5: Configuration Nginx (Option 1 - Path-based)

Si vous voulez accéder à dev via `http://72.61.166.22/dev/...` :

```bash
# Sur le VPS
cd /opt/fortiflow/prod
cp nginx/nginx.multi-env.conf nginx/nginx.conf

# Éditer pour activer le routing par path (décommenter la section alternative)
nano nginx/nginx.conf

# Redémarrer nginx
docker compose restart nginx
```

### Étape 5 Alternative: Configuration Nginx (Option 2 - Subdomain)

Si vous avez un domaine (ex: fortiflow.com), vous pouvez utiliser des sous-domaines :
- Production: `api.fortiflow.com`
- Dev: `dev.fortiflow.com`

```bash
# Configurer les DNS A records:
# api.fortiflow.com → 72.61.166.22
# dev.fortiflow.com → 72.61.166.22

# Sur le VPS, utiliser nginx.multi-env.conf tel quel
cd /opt/fortiflow/prod
cp nginx/nginx.multi-env.conf nginx/nginx.conf
docker compose restart nginx
```

## 🧪 Tester les environnements

### Test Production
```bash
# Depuis votre machine locale
curl http://72.61.166.22/health
# Devrait retourner: {"status": "healthy", "environment": "production"}
```

### Test Développement (Path-based)
```bash
curl http://72.61.166.22:3001/health
# Ou si nginx configuré avec path:
curl http://72.61.166.22/dev/health
```

### Test Développement (Subdomain)
```bash
curl http://dev.fortiflow.com/health
```

## 📝 Mise à jour des URLs dans le code

### Frontend - Nouvel environnement `.env.staging`

Créez `/frontend/.env.staging` :
```bash
VITE_API_URL=http://72.61.166.22:3001
# Ou avec subdomain:
# VITE_API_URL=http://dev.fortiflow.com
```

Modifiez `package.json` pour ajouter un script de build staging :
```json
{
  "scripts": {
    "build:staging": "vite build --mode staging"
  }
}
```

## 🔒 Configuration des GitHub Actions Secrets

Pour permettre le déploiement automatisé, configurez ces secrets dans GitHub :

1. Allez sur votre repo GitHub
2. Settings → Secrets and variables → Actions
3. Ajoutez ces secrets :

| Secret Name | Description | Exemple |
|-------------|-------------|---------|
| `VPS_HOST` | IP ou domaine du VPS | `72.61.166.22` |
| `VPS_USER` | Utilisateur SSH | `root` |
| `VPS_SSH_KEY` | Clé privée SSH | Contenu de `~/.ssh/id_rsa` |
| `VPS_DEV_PATH` | Chemin vers env dev | `/opt/fortiflow/dev` |
| `VPS_PROD_PATH` | Chemin vers env prod | `/opt/fortiflow/prod` |

### Générer une clé SSH dédiée (recommandé)

```bash
# Sur votre machine locale
ssh-keygen -t ed25519 -C "github-actions@fortiflow" -f ~/.ssh/fortiflow_deploy

# Copier la clé publique sur le VPS
ssh-copy-id -i ~/.ssh/fortiflow_deploy.pub root@72.61.166.22

# Afficher la clé privée pour la copier dans GitHub Secrets
cat ~/.ssh/fortiflow_deploy

# Copier tout le contenu (y compris BEGIN/END) dans le secret VPS_SSH_KEY
```

## 🎯 Utilisation au quotidien

### Déployer sur Dev
```bash
# Via GitHub Actions (sera configuré en Phase 2)
# Ou manuellement:
rsync -avz --exclude='venv' --exclude='*.pyc' ./backend/ root@72.61.166.22:/opt/fortiflow/dev/
ssh root@72.61.166.22 "cd /opt/fortiflow/dev && docker compose -f docker-compose.dev.yml restart backend_dev"
```

### Déployer sur Prod
```bash
# Utiliser le script existant (maintenant amélioré)
cd backend
./scripts/deploy-backend.sh
```

### Créer une nouvelle release
```bash
# À la racine du projet
./scripts/prepare-release.sh 1.1.0
```

## 📊 Commandes utiles

### Voir les logs
```bash
# Dev
ssh root@72.61.166.22 "cd /opt/fortiflow/dev && docker compose -f docker-compose.dev.yml logs -f backend_dev"

# Prod
ssh root@72.61.166.22 "cd /opt/fortiflow/prod && docker compose logs -f backend"
```

### Accéder à la base de données
```bash
# Dev
ssh root@72.61.166.22
docker exec -it fortiflow_postgres_dev psql -U fortiflow -d fortiflow_dev

# Prod
docker exec -it fortiflow_postgres psql -U fortiflow -d fortiflow
```

### Arrêter/Démarrer les environnements
```bash
# Dev
cd /opt/fortiflow/dev
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d

# Prod
cd /opt/fortiflow/prod
docker compose down
docker compose up -d
```

## ⚠️ Points d'attention

1. **Bases de données séparées** : Dev et Prod ont des bases PostgreSQL complètement indépendantes
2. **Ports** :
   - Prod: backend interne 8000, nginx 80
   - Dev: backend interne 8000, exposition 3001, postgres 5433
3. **Secrets** : Utilisez des SECRET_KEY différentes entre dev et prod
4. **Stripe** : Utilisez les clés de test Stripe en dev
5. **Backups** : Seule la base prod doit être backupée quotidiennement

## 🐛 Troubleshooting

### Le container dev ne démarre pas
```bash
# Vérifier les logs
docker compose -f docker-compose.dev.yml logs backend_dev

# Vérifier que le port 3001 n'est pas utilisé
netstat -tlnp | grep 3001

# Rebuild le container
docker compose -f docker-compose.dev.yml up -d --build
```

### Conflit de ports PostgreSQL
```bash
# Le dev utilise le port 5433 pour éviter les conflits
# Vérifier :
docker ps | grep postgres
```

### Nginx ne route pas correctement
```bash
# Vérifier la config nginx
docker exec -it fortiflow_nginx nginx -t

# Recharger nginx
docker exec -it fortiflow_nginx nginx -s reload
```

## ✅ Checklist de validation

- [ ] Environnement dev déployé sur VPS
- [ ] Environnement prod fonctionne toujours
- [ ] Les deux bases de données sont séparées
- [ ] Nginx route correctement vers dev et prod
- [ ] Health checks répondent sur les deux environnements
- [ ] GitHub Secrets configurés
- [ ] Script sync-version.js testé et fonctionnel
- [ ] prepare-release.sh mis à jour et testé

## 📚 Prochaines étapes

Une fois la Phase 1 terminée, vous pouvez passer à :
- **Phase 2** : CI/CD Pipeline (tests automatiques, déploiement auto)
- **Phase 3** : Auto-Update Tauri
- **Phase 4** : Monitoring & Sécurité (HTTPS, backups, alertes)
