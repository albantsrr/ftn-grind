# 📚 Guide de test complet - FortiFlow Community

Ce guide regroupe tous les documents et scripts pour tester les fonctionnalités communautaires de FortiFlow.

## 📁 Structure des documents

```
ftn-grind/
├── TESTING_GUIDE.md                      ← Vous êtes ici (index)
├── TEST_COMMUNITY_FEATURES.md            ← Plan de test détaillé
├── COMMUNITY_FEATURES_SUMMARY.md         ← Résumé des features
├── CLAUDE.md                             ← Documentation technique (mise à jour)
└── backend/
    ├── seed_routines.py                  ← Script: créer 30 routines
    ├── seed_ratings.py                   ← Script: ajouter ratings
    ├── check_db.py                       ← Script: vérifier DB
    ├── setup_test_data.sh                ← Script: tout automatiser
    ├── SEED_DATA_README.md              ← Doc des scripts de seeding
    └── QUICK_START_TESTING.md           ← Quick start 5min
```

## 🚀 Démarrage rapide (5 minutes)

### Option A: Je veux juste tester rapidement

👉 **Suivre : [backend/QUICK_START_TESTING.md](backend/QUICK_START_TESTING.md)**

```bash
cd backend
./setup_test_data.sh
```

### Option B: Je veux comprendre en détail

1. **Lire la doc des scripts** : [backend/SEED_DATA_README.md](backend/SEED_DATA_README.md)
2. **Lire le plan de test** : [TEST_COMMUNITY_FEATURES.md](TEST_COMMUNITY_FEATURES.md)
3. **Exécuter les scripts manuellement**

## 📖 Documents par usage

### Pour développer
- **[CLAUDE.md](CLAUDE.md)** - Documentation technique complète
  - Architecture backend/frontend
  - Schéma de base de données
  - Endpoints API
  - Notes de développement

- **[COMMUNITY_FEATURES_SUMMARY.md](COMMUNITY_FEATURES_SUMMARY.md)** - Résumé des 5 features
  - FEATURE 1: Routine Sharing
  - FEATURE 2: Tags System
  - FEATURE 3: Rating System
  - FEATURE 4: Search & Filters
  - FEATURE 5: UX & Polish

### Pour tester
- **[QUICK_START_TESTING.md](backend/QUICK_START_TESTING.md)** - Test rapide en 5min
  - Setup
  - Checklist
  - Dépannage

- **[TEST_COMMUNITY_FEATURES.md](TEST_COMMUNITY_FEATURES.md)** - Plan de test complet
  - Tests par feature
  - Tests end-to-end
  - Cas d'usage
  - Workflows complets

### Pour les scripts
- **[SEED_DATA_README.md](backend/SEED_DATA_README.md)** - Guide des scripts
  - Utilisation
  - Personnalisation
  - Troubleshooting

## 🛠️ Scripts disponibles

### 1. `check_db.py` - Vérifier l'état de la DB

```bash
cd backend
source venv/bin/activate
python check_db.py
```

**Affiche :**
- Nombre d'utilisateurs
- Nombre de routines (public/privé)
- Tags et leur utilisation
- Top 5 des routines notées
- Checklist de préparation

### 2. `seed_routines.py` - Créer des routines de test

```bash
python seed_routines.py        # 30 routines par défaut
python seed_routines.py 50     # 50 routines
```

**Crée :**
- 30 routines variées (Aim, Build, Edit, etc.)
- 2-5 steps par routine
- Tags automatiquement assignés
- 70% publiques, 30% privées

### 3. `seed_ratings.py` - Ajouter des ratings

```bash
python seed_ratings.py
```

**Ajoute :**
- 1-5 ratings par routine publique
- Notes pondérées vers 4-5 étoiles
- Calcul automatique des moyennes

### 4. `setup_test_data.sh` - Tout en un coup

```bash
./setup_test_data.sh
```

**Exécute :**
- seed_routines.py
- seed_ratings.py
- Avec gestion d'erreurs

## 📋 Workflow recommandé

### Première fois (Setup complet)

1. **Démarrer le backend**
   ```bash
   cd backend
   ./run_backend.sh
   ```

2. **Démarrer le frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Créer l'utilisateur 'albant'**
   - Aller sur http://localhost:5173/register
   - Username: `albant`
   - Email: `albanteissier191@yahoo.fr`
   - Password: au choix

4. **Exécuter les scripts**
   ```bash
   cd backend
   source venv/bin/activate
   ./setup_test_data.sh
   ```

5. **Vérifier**
   ```bash
   python check_db.py
   ```

6. **Tester dans l'app**
   - Login avec 'albant'
   - Voir "Mes Routines" (30 routines)
   - Aller sur "Communauté" (~21 routines publiques)
   - Tester recherche, filtres, tri, pagination, ratings

### Tests quotidiens (Développement)

1. **Vérifier l'état**
   ```bash
   python check_db.py
   ```

2. **Tester une feature spécifique**
   - Voir [TEST_COMMUNITY_FEATURES.md](TEST_COMMUNITY_FEATURES.md)
   - Section par feature

3. **Reset si nécessaire**
   ```bash
   rm fortiflow.db
   # Redémarrer backend
   # Recréer utilisateur
   # Relancer scripts
   ```

## 🎯 Checklist globale

### Préparation
- [ ] Backend démarré (port 3000)
- [ ] Frontend démarré (port 5173)
- [ ] Base de données créée
- [ ] Utilisateur 'albant' existe
- [ ] Tags créés (8 tags par défaut)

### Scripts exécutés
- [ ] `seed_routines.py` exécuté
- [ ] 30 routines créées
- [ ] Tags assignés automatiquement
- [ ] Routines publiques/privées (70/30)
- [ ] `seed_ratings.py` exécuté (optionnel)
- [ ] Ratings ajoutés aux routines publiques

### Tests features
- [ ] FEATURE 1: Partage de routines ✅
- [ ] FEATURE 2: Système de tags ✅
- [ ] FEATURE 3: Système de notation ✅
- [ ] FEATURE 4: Recherche et filtres ✅
- [ ] FEATURE 5: UX & Polish ✅

### Tests end-to-end
- [ ] Workflow complet testé
- [ ] Multi-utilisateurs testé
- [ ] Performance acceptable
- [ ] Pas d'erreurs console
- [ ] Responsive testé
- [ ] Dark mode testé

## 🐛 Dépannage rapide

| Problème | Solution |
|----------|----------|
| User 'albant' not found | Créer le compte dans l'app |
| No tags found | Redémarrer le backend |
| No rating columns | Supprimer DB et redémarrer |
| Import errors | Activer venv: `source venv/bin/activate` |
| Port 3000 occupied | Tuer processus ou changer port |
| Routines not showing | Vérifier `is_public=True` |

## 📊 Métriques de test

Après seeding complet, vous devriez avoir :

```
✅ 30 routines créées
✅ ~21 routines publiques
✅ ~9 routines privées
✅ 8 tags disponibles
✅ ~2-3 tags par routine
✅ ~50-100 ratings au total
✅ 2-3 pages de pagination
```

## 🎓 Ressources

- **Documentation API**: http://localhost:3000/docs
- **Health check**: http://localhost:3000/health
- **Frontend**: http://localhost:5173
- **Community**: http://localhost:5173/community

## 💡 Tips

1. **Performance**: 30 routines = sweet spot pour tester pagination
2. **Multi-user**: Créer 2-3 comptes pour tester interactions
3. **Reset rapide**: `rm fortiflow.db` + redémarrer backend
4. **Personnalisation**: Modifier les constantes dans `seed_routines.py`
5. **Debug**: Activer les logs dans le backend avec `--log-level debug`

## 🚀 Prochaines étapes après tests

Si tous les tests passent :
- ✅ Les features sont prêtes pour la production
- ✅ Tester le build Tauri: `npm run tauri:build`
- ✅ Tester sur différents OS (Windows prioritaire)
- ✅ Documenter pour les utilisateurs finaux
- ✅ Préparer le release

## 📝 Notes importantes

- **Backend reload**: Les scripts modifient la DB, pas besoin de redémarrer
- **Frontend reload**: Rafraîchir la page après seeding pour voir les nouvelles données
- **Persistence**: Les données persistent tant que `fortiflow.db` existe
- **Backup**: Faire `cp fortiflow.db fortiflow.db.backup` avant gros changements

## ✅ Validation finale

Avant de considérer les features complètes :

1. ✅ Tous les scripts s'exécutent sans erreur
2. ✅ `check_db.py` affiche "Ready for testing"
3. ✅ Toutes les features du [TEST_COMMUNITY_FEATURES.md](TEST_COMMUNITY_FEATURES.md) passent
4. ✅ Workflow complet fonctionne
5. ✅ Pas d'erreurs console
6. ✅ Performance acceptable
7. ✅ Documentation à jour

---

**Dernière mise à jour** : Après implémentation des features 1-5
**Status** : ✅ Prêt pour test complet
