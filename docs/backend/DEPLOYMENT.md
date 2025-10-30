# Déploiement Backend FortiFlow

## Architecture Production

Le backend FortiFlow est déployé sur un VPS Hostinger avec Docker Compose.

### Stack
- **FastAPI** : Backend Python (container `backend`)
- **PostgreSQL 15** : Base de données (container `postgres`)
- **Nginx** : Reverse proxy (container `nginx`)

### URLs
- API : `http://72.61.166.22`
- Health : `http://72.61.166.22/health`
- Documentation : `http://72.61.166.22/docs`

## Déploiement Initial (Déjà fait ✅)

Le backend a déjà été déployé avec succès sur le VPS. Les containers Docker tournent et l'API est opérationnelle.

## Redéployer après des changements

### Méthode 1 : Script automatique (recommandé)

```bash
cd backend
./deploy.sh
```

Ce script :
1. Synchronise les fichiers avec le VPS
2. Rebuild et redémarre les containers Docker
3. Teste la santé de l'API
4. Affiche les logs

### Méthode 2 : Manuelle

```bash
# 1. Synchroniser les fichiers
rsync -avz --exclude='venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='fortiflow.db' --exclude='tests' --exclude='.env' backend/ root@72.61.166.22:/opt/fortiflow/backend/

# 2. Se connecter au VPS et redémarrer
ssh root@72.61.166.22
cd /opt/fortiflow/backend
docker compose down
docker compose up -d --build

# 3. Vérifier les logs
docker compose logs -f backend
```

## Commandes utiles sur le VPS

```bash
# Se connecter au VPS
ssh root@72.61.166.22

# Aller dans le dossier du backend
cd /opt/fortiflow/backend

# Voir l'état des containers
docker compose ps

# Voir les logs
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f nginx

# Redémarrer un service spécifique
docker compose restart backend
docker compose restart nginx

# Arrêter tous les services
docker compose down

# Démarrer tous les services
docker compose up -d

# Rebuild complet
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Accès à PostgreSQL

### Depuis le VPS
```bash
# Se connecter à la base de données
docker compose exec postgres psql -U fortiflow -d fortiflow

# Lister les routines
docker compose exec postgres psql -U fortiflow -d fortiflow -c "SELECT * FROM routines;"

# Lister les steps
docker compose exec postgres psql -U fortiflow -d fortiflow -c "SELECT * FROM routine_steps;"
```

### Depuis votre machine locale (via tunnel SSH)
```bash
# Créer un tunnel SSH
ssh -L 5432:localhost:5432 root@72.61.166.22

# Dans un autre terminal, se connecter avec psql
psql -h localhost -U fortiflow -d fortiflow
```

## Backup de la base de données

### Créer un backup manuel
```bash
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose exec -T postgres pg_dump -U fortiflow fortiflow > /opt/fortiflow/backups/backup-$(date +%Y%m%d-%H%M%S).sql"
```

### Restaurer un backup
```bash
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose exec -T postgres psql -U fortiflow -d fortiflow < /opt/fortiflow/backups/backup-YYYYMMDD-HHMMSS.sql"
```

### Backup automatique (à configurer)
Créer un cron job sur le VPS :
```bash
# Éditer crontab
crontab -e

# Ajouter cette ligne pour backup quotidien à 3h du matin
0 3 * * * cd /opt/fortiflow/backend && docker compose exec -T postgres pg_dump -U fortiflow fortiflow > /opt/fortiflow/backups/backup-$(date +\%Y\%m\%d).sql
```

## Monitoring

### Vérifier la santé de l'API
```bash
curl http://72.61.166.22/health
# Réponse attendue: {"status":"healthy"}
```

### Vérifier l'utilisation des ressources
```bash
ssh root@72.61.166.22 "docker stats --no-stream"
```

### Vérifier l'espace disque
```bash
ssh root@72.61.166.22 "df -h"
```

## Variables d'environnement

Les variables sont stockées dans `/opt/fortiflow/backend/.env` sur le VPS :

```env
POSTGRES_USER=fortiflow
POSTGRES_PASSWORD=<généré-automatiquement>
POSTGRES_DB=fortiflow
```

**⚠️ Important:** Ne jamais commit le fichier `.env` dans Git. Il contient des informations sensibles.

## Firewall

Le VPS a un firewall configuré (ufw) qui autorise uniquement :
- Port 22 (SSH)
- Port 80 (HTTP)

PostgreSQL (port 5432) n'est **pas** exposé publiquement pour des raisons de sécurité.

## Développement local vs Production

### Développement local
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 3000
```
→ Utilise SQLite (`fortiflow.db`)

### Production (VPS)
→ Utilise PostgreSQL dans Docker
→ Backend disponible sur `http://72.61.166.22`

## Troubleshooting

### L'API ne répond pas
```bash
# Vérifier les logs
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs backend"

# Redémarrer le backend
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose restart backend"
```

### Erreur de connexion PostgreSQL
```bash
# Vérifier que PostgreSQL tourne
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose ps postgres"

# Vérifier les logs PostgreSQL
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs postgres"
```

### Container en erreur
```bash
# Voir les détails de l'erreur
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs <nom_du_container>"

# Recréer les containers
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose down && docker compose up -d --force-recreate"
```

## Prochaines étapes (optionnel)

1. **SSL/HTTPS** : Acheter un domaine et configurer Let's Encrypt
2. **CI/CD** : Automatiser le déploiement avec GitHub Actions
3. **Monitoring** : Configurer des alertes (UptimeRobot, etc.)
4. **Backups automatiques** : Cron job pour backups quotidiens
5. **Authentification** : Ajouter JWT pour sécuriser l'API
