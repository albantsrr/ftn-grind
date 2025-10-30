# Scripts de génération de données de test

Ces scripts permettent de créer des données de test pour développer et tester les fonctionnalités de FortiFlow.

## 📋 Prérequis

1. **Le backend doit être démarré** (pour créer la base de données)
2. **L'utilisateur 'albant' doit exister** (créer un compte via l'app)
3. Optionnel : Créer 1-2 autres utilisateurs pour tester les ratings

## 🚀 Utilisation rapide

### Méthode 1 : Script automatique (Recommandé)

```bash
cd backend
./setup_test_data.sh
```

Ce script va :
1. ✅ Créer 30 routines pour l'utilisateur 'albant'
2. ✅ Ajouter des ratings aléatoires aux routines publiques

### Méthode 2 : Scripts individuels

```bash
cd backend
source venv/bin/activate

# Créer 30 routines
python seed_routines.py

# Ou créer un nombre personnalisé
python seed_routines.py 50

# Ajouter des ratings (optionnel)
python seed_ratings.py
```

## 📝 Description des scripts

### `seed_routines.py`

Crée des routines de test pour l'utilisateur 'albant'.

**Caractéristiques :**
- 30 routines par défaut (personnalisable)
- Routines variées : Aim, Build, Edit, Movement, Box Fight, Zone Wars, Creative
- 2-5 steps par routine avec des durées aléatoires
- 70% des routines sont publiques
- Tags automatiquement assignés selon le type de routine
- Sons aléatoires (beep, bell, chime, notification)
- Dates créées dans les 30 derniers jours

**Noms de routines générées :**
- "Warm-up Aim Training"
- "90s Practice Basic"
- "Fast Edit Course"
- "Box Fight Warm-up"
- "Zone Wars Rotation"
- Et bien d'autres...

**Exemples de steps :**
- "Flick shots (180°)" - Tile Frenzy - 5min
- "90s continuous" - Infinite 90s - 4min
- "Window edits" - Edit Course - 3min
- "Piece control" - Box Fight Arena - 5min

### `seed_ratings.py`

Ajoute des ratings aléatoires aux routines publiques.

**Caractéristiques :**
- 1-5 ratings par routine publique
- Notes pondérées vers 4-5 étoiles (plus réaliste)
- Ne peut pas noter ses propres routines
- Calcul automatique des moyennes
- Affiche le top 5 des routines les mieux notées

**Distribution des notes :**
- 5 étoiles : 35% de chance
- 4 étoiles : 30% de chance
- 3 étoiles : 20% de chance
- 2 étoiles : 10% de chance
- 1 étoile : 5% de chance

### `setup_test_data.sh`

Script Bash qui exécute tout automatiquement avec gestion d'erreurs.

## 🔧 Étapes détaillées

### 1. Préparation

```bash
# Démarrer le backend (terminal 1)
cd backend
./run_backend.sh

# Démarrer le frontend (terminal 2)
cd frontend
npm run dev
```

### 2. Créer l'utilisateur 'albant'

1. Aller sur http://localhost:5173/register
2. Créer un compte avec :
   - Email : `albant@test.com`
   - Username : `albant`
   - Password : au choix

### 3. (Optionnel) Créer d'autres utilisateurs

Pour tester les ratings, créer 1-2 autres comptes :
- `testuser1@test.com` / `testuser1`
- `testuser2@test.com` / `testuser2`

### 4. Exécuter les scripts

```bash
cd backend
./setup_test_data.sh
```

## 📊 Résultat attendu

Après exécution, vous devriez avoir :

**Dans "Mes Routines" (utilisateur albant) :**
- ~9 routines privées
- ~21 routines publiques
- Total : 30 routines

**Dans "Communauté" :**
- ~21 routines publiques visibles
- Avec tags colorés
- Avec ratings (si seed_ratings.py exécuté)

**Fonctionnalités testables :**
- ✅ Recherche par nom
- ✅ Filtre par tags (multiple)
- ✅ Tri par date/nom/rating
- ✅ Pagination (2-3 pages)
- ✅ Notation des routines
- ✅ Partager/retirer du public

## 🐛 Dépannage

### Erreur "User 'albant' not found"

**Solution :** Créer le compte 'albant' dans l'app d'abord.

```bash
# Vérifier si l'utilisateur existe
cd backend
source venv/bin/activate
python -c "
from database import SessionLocal
from models import User
db = SessionLocal()
users = db.query(User).all()
print('Users:', [u.username for u in users])
db.close()
"
```

### Erreur "No tags found"

**Solution :** Redémarrer le backend pour créer les tags par défaut.

```bash
# Dans le terminal du backend
Ctrl+C
./run_backend.sh
```

### Erreur "Need at least 2 users to add ratings"

**Solution :** Créer un deuxième utilisateur dans l'app.

### Les routines existent déjà

Le script n'écrase PAS les routines existantes par défaut.

Pour supprimer toutes les routines de 'albant' :

```python
# Dans backend/seed_routines.py, décommenter les lignes 122-125
existing_count = db.query(Routine).filter(Routine.user_id == user.id).count()
if existing_count > 0:
    db.query(Routine).filter(Routine.user_id == user.id).delete()
    print(f"✓ Deleted {existing_count} existing routines")
```

## 🎯 Personnalisation

### Créer plus/moins de routines

```bash
# 50 routines
python seed_routines.py 50

# 10 routines
python seed_routines.py 10
```

### Ajouter vos propres routines

Modifier `ROUTINE_NAMES` dans `seed_routines.py` :

```python
ROUTINE_NAMES = [
    "Ma routine custom 1",
    "Ma routine custom 2",
    # ...
]
```

### Ajouter vos propres steps

Modifier `STEP_TEMPLATES` dans `seed_routines.py` :

```python
STEP_TEMPLATES = [
    {"nom": "Mon step", "code_map": "Mon Map", "duree": 300, "tips": "Mes tips"},
    # ...
]
```

## 📈 Statistiques après seeding

```
✅ Successfully created 30 routines for user 'albant'!

💡 Tip: 21 routines are public. You can add ratings to them from another user account!

📊 Summary:
   Total routines: 30
   Public routines: 21
   Private routines: 9
```

## 🔗 Fichiers créés

- `seed_routines.py` - Générateur de routines
- `seed_ratings.py` - Générateur de ratings
- `setup_test_data.sh` - Script automatique
- `SEED_DATA_README.md` - Cette documentation

## 💡 Conseils

1. **Exécuter après chaque reset de base :** Si vous supprimez `fortiflow.db`, relancer les scripts
2. **Tester avec plusieurs users :** Créer 2-3 comptes pour tester les ratings et interactions
3. **Vérifier dans l'app :** Toujours vérifier que tout s'affiche correctement dans l'interface
4. **Performance :** 30 routines permettent de tester la pagination (3 pages de 12)

## ✅ Checklist de test après seeding

- [ ] Les routines apparaissent dans "Mes Routines"
- [ ] Les routines publiques apparaissent dans "Communauté"
- [ ] Les tags sont affichés correctement
- [ ] La recherche fonctionne
- [ ] Le filtre par tags fonctionne
- [ ] Le tri fonctionne (date/nom/rating)
- [ ] La pagination fonctionne (2-3 pages)
- [ ] Les ratings s'affichent
- [ ] Je peux noter une routine depuis un autre compte
- [ ] Le bouton "Partager" fonctionne
