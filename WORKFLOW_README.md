# 🚀 FortiFlow - Workflow de Développement

Ce document explique rapidement le nouveau workflow de développement mis en place pour FortiFlow.

## 🎯 Quick Start

### Créer une nouvelle release

```bash
# Une seule commande pour tout faire !
./scripts/prepare-release.sh 1.1.0
```

Ce script :
- ✅ Met à jour `version.json` (source unique)
- ✅ Synchronise automatiquement vers `package.json`, `tauri.conf.json`, `Cargo.toml`
- ✅ Met à jour `docs/index.html`
- ✅ Crée le commit et le tag
- ✅ Propose de push automatiquement

### Synchroniser les versions manuellement

```bash
# Si vous avez modifié version.json manuellement
node scripts/sync-version.js

# Ou changer la version directement
node scripts/sync-version.js 1.2.0
```

### Déployer sur le backend

```bash
# Production
cd backend
./scripts/deploy-backend.sh

# Développement (après Phase 1 setup)
# Via GitHub Actions ou manuellement :
rsync -avz ./backend/ root@72.61.166.22:/opt/fortiflow/dev/
ssh root@72.61.166.22 "cd /opt/fortiflow/dev && docker compose -f docker-compose.dev.yml restart"
```

---

## 📁 Structure des Environnements

### Local (Développement)
- **Frontend** : `http://localhost:5173`
- **Backend** : `http://localhost:3000`
- **Database** : SQLite (`backend/fortiflow.db`)

### VPS Dev (après Phase 1)
- **Backend** : `http://72.61.166.22:3001` ou `http://dev.fortiflow.com`
- **Database** : PostgreSQL (`fortiflow_dev`)
- **But** : Tester en conditions réelles avant prod

### VPS Prod
- **Backend** : `http://72.61.166.22`
- **Database** : PostgreSQL (`fortiflow`)
- **But** : Environnement de production pour les users

---

## 📚 Documentation

### Guides détaillés
- **[WORKFLOW_IMPROVEMENTS_PHASE1.md](WORKFLOW_IMPROVEMENTS_PHASE1.md)** - Vue d'ensemble complète de la Phase 1
- **[docs/deployment/PHASE1_SETUP_GUIDE.md](docs/deployment/PHASE1_SETUP_GUIDE.md)** - Guide pas-à-pas pour déployer
- **[CLAUDE.md](CLAUDE.md)** - Documentation technique du projet

### Fichiers clés
- **`version.json`** - Version centralisée (source de vérité)
- **`scripts/sync-version.js`** - Outil de synchronisation des versions
- **`scripts/prepare-release.sh`** - Script de release automatisé
- **`backend/docker-compose.yml`** - Production Docker config
- **`backend/docker-compose.dev.yml`** - Dev Docker config

---

## 🔄 Workflow Git

```
┌─────────┐
│  Local  │  → git push → GitHub
└────┬────┘              ↓
     │              ┌────────────┐
     │              │  CI/CD     │  (Phase 2)
     │              │  Tests     │
     │              └──────┬─────┘
     │                     │
     │              ┌──────┴─────┐
     │              ↓            ↓
     │         ┌────────┐  ┌──────────┐
     │         │  Dev   │  │   Prod   │
     │         │  VPS   │  │   VPS    │
     │         └────────┘  └──────────┘
     │              ↑            ↑
     └──────────────┴────────────┘
        Deploy manuel (Phase 1)
```

---

## 🏗️ Phases d'Amélioration

### ✅ Phase 1 : Fondations (Complété)
- Gestion centralisée des versions
- Docker multi-environnements
- Infrastructure dev/prod séparée

### 🔲 Phase 2 : CI/CD (À venir)
- Tests automatiques
- Déploiement automatisé
- Releases GitHub auto-publiées

### 🔲 Phase 3 : Auto-Update (À venir)
- Notification des mises à jour dans l'app
- Update automatique de l'app Tauri

### 🔲 Phase 4 : Production Ready (À venir)
- HTTPS + domaine
- Backups automatiques
- Monitoring & alertes

---

## 💡 Commandes Utiles

### Développement
```bash
# Backend
cd backend && ./run_backend.sh

# Frontend
cd frontend && npm run dev

# Tauri (desktop app)
cd frontend && npm run tauri:dev
```

### Tests
```bash
# Backend tests
cd backend && pytest

# Frontend lint
cd frontend && npm run lint

# Frontend build (check for errors)
cd frontend && npm run build
```

### Versions
```bash
# Voir la version actuelle
cat version.json

# Sync versions
node scripts/sync-version.js

# Nouvelle version
node scripts/sync-version.js 1.2.0
```

### Docker (sur VPS)
```bash
# Dev
ssh root@72.61.166.22
cd /opt/fortiflow/dev
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f backend_dev

# Prod
cd /opt/fortiflow/prod
docker compose ps
docker compose logs -f backend
```

---

## 🐛 Troubleshooting

### Les versions ne se synchronisent pas
```bash
# Vérifier que le script a les bonnes permissions
chmod +x scripts/sync-version.js

# Exécuter manuellement avec Node
node scripts/sync-version.js
```

### Le backend ne démarre pas
```bash
# Vérifier la version de Python (doit être 3.10-3.12)
python --version

# Vérifier que SECRET_KEY est défini
cat backend/.env | grep SECRET_KEY

# Voir les logs
cd backend && docker compose logs -f
```

### Le build frontend échoue
```bash
# Vérifier Node version (recommandé: v18 ou v20)
node --version

# Nettoyer et rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

---

## 🎉 Résumé des Améliorations

| Aspect | Avant | Après |
|--------|-------|-------|
| **Releases** | 7 étapes manuelles, 15 min | 1 commande, 2 min |
| **Versions** | 3 fichiers à sync manuellement | Automatique via `version.json` |
| **Environnements** | Local + Prod | Local + Dev VPS + Prod |
| **Déploiement** | SSH + commandes manuelles | Script automatisé |
| **Risque d'erreur** | Élevé | Quasi-nul |

---

## 📞 En cas de problème

1. Consulter [PHASE1_SETUP_GUIDE.md](docs/deployment/PHASE1_SETUP_GUIDE.md)
2. Vérifier les logs : `docker compose logs -f`
3. Tester les health checks : `curl http://72.61.166.22/health`
4. Consulter [CLAUDE.md](CLAUDE.md) pour la doc technique

---

**Prêt à déployer en toute confiance ! 🚀**
