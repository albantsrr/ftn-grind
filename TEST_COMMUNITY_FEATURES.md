# Test Plan: Community Features (Features 1-5)

## ⚠️ IMPORTANT: Prérequis
**Avant de tester, il faut REDÉMARRER le backend** pour recréer la base de données avec les nouveaux schémas :
```bash
# Dans le terminal où tourne le backend
Ctrl+C  # Arrêter le serveur

# Relancer
cd backend
./run_backend.sh
# OU
source venv/bin/activate && uvicorn main:app --reload --port 3000
```

---

## FEATURE 1: Routine Sharing System

### Test 1.1: Partager une routine
1. Aller sur la page principale (Mes Routines)
2. Créer une nouvelle routine avec au moins 2 steps
3. Cliquer sur le bouton "Partager" sur la routine card
4. Vérifier que le bouton change d'état (partagé/non partagé)
5. Aller sur la page Communauté
6. Vérifier que la routine apparaît dans la liste

✅ **Attendu**: La routine est visible dans la communauté avec votre nom d'utilisateur

### Test 1.2: Annuler le partage
1. Retourner sur Mes Routines
2. Cliquer à nouveau sur "Partager" pour rendre la routine privée
3. Retourner sur Communauté
4. Vérifier que la routine n'apparaît plus

✅ **Attendu**: La routine disparaît de la communauté

---

## FEATURE 2: Tags System

### Test 2.1: Ajouter des tags lors de la création
1. Créer une nouvelle routine
2. Après création, utiliser le TagSelector pour ajouter 2-3 tags
3. Vérifier que les tags apparaissent sur la routine card

✅ **Attendu**: Les tags sont affichés avec leurs couleurs

### Test 2.2: Modifier les tags
1. Éditer une routine existante
2. Utiliser le TagSelector pour ajouter/supprimer des tags
3. Sauvegarder et vérifier que les changements sont persistés

✅ **Attendu**: Les modifications de tags sont sauvegardées

---

## FEATURE 3: Rating System

### Test 3.1: Noter une routine de la communauté
1. Aller sur la page Communauté
2. Cliquer sur l'icône étoile jaune d'une routine
3. Sélectionner une note (ex: 4 étoiles)
4. Vérifier que la modal se ferme
5. Vérifier que la note moyenne est mise à jour sur la routine card

✅ **Attendu**: La note est enregistrée et la moyenne affichée

### Test 3.2: Modifier sa note
1. Re-cliquer sur l'icône étoile de la même routine
2. Changer la note (ex: 5 étoiles)
3. Vérifier que la mise à jour est prise en compte

✅ **Attendu**: La note est mise à jour

### Test 3.3: Supprimer sa note
1. Ouvrir la modal de notation
2. Cliquer sur "Supprimer ma note"
3. Vérifier que la note est retirée

✅ **Attendu**: La note est supprimée et la moyenne recalculée

### Test 3.4: Tri par note
1. Sur la page Communauté, sélectionner "Mieux notés" dans le tri
2. Vérifier que les routines sont triées par note décroissante

✅ **Attendu**: Les routines les mieux notées apparaissent en premier

---

## FEATURE 4: Search & Filters

### Test 4.1: Recherche par nom
1. Aller sur la page Communauté
2. Taper un nom de routine dans la barre de recherche
3. Attendre ~400ms (debounce)
4. Vérifier que seules les routines correspondantes s'affichent

✅ **Attendu**: Recherche en temps réel avec debounce

### Test 4.2: Filtre par tags
1. Cliquer sur "Filtrer par tags"
2. Sélectionner 1-2 tags
3. Vérifier que seules les routines avec ces tags s'affichent
4. Vérifier le badge de comptage des filtres actifs

✅ **Attendu**: Filtrage par tags fonctionnel

### Test 4.3: Combinaison de filtres
1. Utiliser la recherche + filtre par tags en même temps
2. Vérifier que les résultats correspondent aux deux critères

✅ **Attendu**: Les filtres se combinent correctement

### Test 4.4: Effacer les filtres
1. Activer plusieurs filtres
2. Cliquer sur "Effacer tous les filtres" dans le FilterPanel
3. Vérifier que tous les résultats reviennent

✅ **Attendu**: Tous les filtres sont effacés

---

## FEATURE 5: UX & Polish

### Test 5.1: Pagination
1. S'assurer qu'il y a plus de 12 routines dans la communauté
2. Vérifier que seules 12 routines s'affichent par page
3. Cliquer sur "Suivant"
4. Vérifier que la page 2 s'affiche avec les routines suivantes
5. Cliquer sur "Précédent"

✅ **Attendu**: Navigation par pages fluide

### Test 5.2: Skeleton Loaders
1. Rafraîchir la page Communauté
2. Observer les skeleton cards pendant le chargement
3. Vérifier qu'ils disparaissent quand les données sont chargées

✅ **Attendu**: Loading states visuels professionnels

### Test 5.3: Messages d'erreur
1. Arrêter le backend
2. Essayer de charger la page Communauté
3. Vérifier le message d'erreur amélioré avec icône et bouton retry
4. Redémarrer le backend et cliquer sur "Réessayer"

✅ **Attendu**: Message d'erreur clair avec actions possibles

### Test 5.4: Animations
1. Aller sur la page Communauté
2. Observer les animations fade-in des routine cards
3. Survoler les boutons et badges
4. Vérifier les effets de hover (scale, transitions)

✅ **Attendu**: Animations fluides et professionnelles

### Test 5.5: Tooltips
1. Survoler l'icône étoile jaune sur une routine
2. Vérifier l'apparition du tooltip
3. Tester sur différentes positions

✅ **Attendu**: Tooltips informatifs et bien positionnés

---

## Tests de bout en bout

### Workflow complet
1. **Créer** une routine avec steps et tags
2. **Partager** la routine
3. **Aller** sur Communauté
4. **Rechercher** la routine par son nom
5. **Filtrer** par ses tags
6. **Noter** la routine avec 5 étoiles
7. **Trier** par "Mieux notés"
8. Vérifier que la routine apparaît en haut

✅ **Attendu**: Workflow complet fonctionnel

---

## API Endpoints à tester manuellement

```bash
# Health check
curl http://localhost:3000/health

# Get community routines (requires auth token)
TOKEN="your_jwt_token"

# Basic listing
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/community/routines

# With search
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/community/routines?search=warm"

# With tags filter
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/community/routines?tags=1,2"

# With sorting
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/community/routines?sort_by=rating"

# Rate a routine
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"rating": 5}' http://localhost:3000/api/ratings/routines/1/rate

# Get rating info
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/ratings/routines/1/rating
```

---

## Checklist finale

- [ ] Backend redémarré avec nouvelle base de données
- [ ] Toutes les features FEATURE 1-5 testées
- [ ] Aucune erreur console dans le navigateur
- [ ] Responsive design vérifié (mobile/tablet/desktop)
- [ ] Dark mode fonctionne correctement
- [ ] Performance acceptable (pas de lags)
- [ ] Documentation CLAUDE.md mise à jour
