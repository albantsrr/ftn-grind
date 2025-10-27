# 🚀 Quick Start - Testing Community Features

Guide rapide pour tester toutes les fonctionnalités communautaires en 5 minutes.

## Étape 1: Vérifier l'état de la base de données

```bash
cd backend
source venv/bin/activate
python check_db.py
```

Vous devriez voir :
- ✅ Utilisateur 'albant' existe
- ✅ 8 tags existent
- ⚠️ Peu ou pas de routines

## Étape 2: Générer les données de test

```bash
# Méthode automatique (recommandé)
./setup_test_data.sh

# OU méthode manuelle
python seed_routines.py     # Crée 30 routines
python seed_ratings.py       # Ajoute des ratings (optionnel)
```

**Résultat attendu :**
```
✅ Successfully created 30 routines for user 'albant'!
📊 Summary:
   Total routines: 30
   Public routines: ~21
   Private routines: ~9
```

## Étape 3: Vérifier les données créées

```bash
python check_db.py
```

Vous devriez maintenant voir :
- ✅ 30 routines pour 'albant'
- ✅ ~21 routines publiques
- ✅ Tags assignés aux routines
- ✅ Ratings (si seed_ratings.py exécuté)

## Étape 4: Tester dans l'application

### A. Login
1. Aller sur http://localhost:5173/login
2. Se connecter avec 'albant'

### B. Tester "Mes Routines"
- ✅ Voir toutes les 30 routines (publiques + privées)
- ✅ Voir les tags sur chaque routine
- ✅ Cliquer sur "Partager" pour changer le statut public/privé

### C. Tester "Communauté"
1. Aller sur l'onglet Communauté
2. Voir les ~21 routines publiques

**Tester la recherche :**
- ✅ Taper "aim" → voir uniquement les routines aim
- ✅ Taper "90s" → voir uniquement les routines 90s
- ✅ Taper "edit" → voir uniquement les routines edit

**Tester les filtres par tags :**
- ✅ Cliquer sur "Filtrer par tags"
- ✅ Sélectionner "Aim Training"
- ✅ Voir uniquement les routines avec ce tag
- ✅ Sélectionner plusieurs tags
- ✅ Cliquer sur "Effacer tous les filtres"

**Tester le tri :**
- ✅ Tri par "Plus récent" (défaut)
- ✅ Tri par "Nom (A-Z)"
- ✅ Tri par "Mieux notés" (si ratings existent)

**Tester la pagination :**
- ✅ Voir 12 routines par page
- ✅ Cliquer sur "Suivant" → page 2
- ✅ Cliquer sur "Précédent" → page 1
- ✅ Scroll automatique en haut

**Tester la notation :**
- ✅ Cliquer sur l'étoile jaune d'une routine
- ✅ Choisir une note (1-5 étoiles)
- ✅ Voir la moyenne mise à jour
- ✅ Re-cliquer pour modifier sa note
- ✅ Cliquer sur "Supprimer ma note"

### D. Tester l'UX
- ✅ Observer les skeleton loaders pendant le chargement
- ✅ Voir les animations fade-in des cartes
- ✅ Survoler le bouton étoile → voir le tooltip
- ✅ Voir les effets hover sur les boutons
- ✅ Tester le dark mode

## Étape 5: Tester avec un 2ème utilisateur (optionnel)

Pour tester les ratings entre utilisateurs :

1. **Créer un 2ème compte :**
   - Se déconnecter
   - Créer un compte "testuser1"

2. **Aller sur Communauté :**
   - Voir les routines de 'albant'
   - Noter quelques routines

3. **Revenir sur 'albant' :**
   - Voir les notes ajoutées
   - Vérifier qu'on ne peut pas noter ses propres routines

## Étapes de dépannage

### Problème : "User 'albant' not found"

```bash
# Créer le compte dans l'app
# Puis vérifier qu'il existe :
python -c "
from database import SessionLocal
from models import User
db = SessionLocal()
users = db.query(User).all()
print('Users:', [u.username for u in users])
db.close()
"
```

### Problème : "No tags found"

```bash
# Redémarrer le backend (Ctrl+C puis relancer)
cd backend
./run_backend.sh
```

### Problème : Base de données manque les colonnes rating

```bash
# Supprimer et redémarrer
rm fortiflow.db
# Redémarrer le backend pour recréer la base
```

### Problème : Erreur lors du seeding

```bash
# Vérifier l'état actuel
python check_db.py

# Nettoyer et recommencer
rm fortiflow.db
# Redémarrer backend
# Créer utilisateur 'albant'
# Relancer setup_test_data.sh
```

## Commandes utiles

```bash
# Vérifier l'état
python check_db.py

# Créer 50 routines au lieu de 30
python seed_routines.py 50

# Ajouter des ratings
python seed_ratings.py

# Script automatique complet
./setup_test_data.sh
```

## Checklist complète

- [ ] Backend démarré
- [ ] Frontend démarré
- [ ] Utilisateur 'albant' créé
- [ ] Scripts de seeding exécutés
- [ ] 30 routines créées
- [ ] Tags assignés
- [ ] Ratings ajoutés (optionnel)
- [ ] Recherche testée
- [ ] Filtres testés
- [ ] Tri testé
- [ ] Pagination testée
- [ ] Notation testée
- [ ] UX vérifiée (animations, tooltips)

## 🎉 Bravo !

Si tous les tests passent, toutes les fonctionnalités communautaires sont opérationnelles !

## Questions fréquentes

**Q: Combien de temps prend le seeding ?**
A: ~5-10 secondes pour 30 routines

**Q: Puis-je modifier les routines générées ?**
A: Oui ! Modifier `ROUTINE_NAMES` et `STEP_TEMPLATES` dans `seed_routines.py`

**Q: Les données persistent après redémarrage ?**
A: Oui, tant que vous ne supprimez pas `fortiflow.db`

**Q: Comment nettoyer toutes les données ?**
A: `rm fortiflow.db` puis redémarrer le backend

**Q: Puis-je seeder pour un autre utilisateur ?**
A: Oui, modifier `username == "albant"` dans les scripts
