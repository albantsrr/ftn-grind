# Statistics V1 - Résumé des changements

## Vue d'ensemble

Implémentation de l'onglet Statistics V1 avec système de grades amélioré, composants simplifiés, et outils de test.

## Changements effectués

###  1. Simplification de l'UI (V1)

**✅ Composants conservés :**
- `GradeBadge.tsx` - Badge animé avec cercle de progression
- `StatsCard.tsx` - Cartes statistiques avec animations
- `GradeProgress.tsx` - Système de grades avec barres de progression
- `StatsSkeleton.tsx` - Skeleton loader animé

**❌ Composants retirés (pour v2) :**
- `ActivityChart.tsx` - Graphique d'activité détaillé
- `HeatmapCalendar.tsx` - Calendrier heatmap

**Raison :** Simplifier l'interface pour la V1, focus sur l'essentiel

---

### 2. Système de grades amélioré

**Nouveaux seuils (backend + frontend) :**

| Grade | Routines | Série | Temps |
|-------|----------|-------|-------|
| 🥉 Bronze | 10 | 5 jours | 1h |
| 🥈 Silver | 50 | 15 jours | 5h |
| 🥇 Gold | 150 | 30 jours | 15h |
| 💎 Platinum | 300 | 60 jours | 30h |
| 💠 Diamond | 600 | 120 jours | 60h |
| 🏆 Legend | 1000 | 200 jours | 100h |

**Changements :**
- ✅ **3 critères requis** (routines + série + temps) au lieu de 2
- ✅ **Seuils plus élevés** pour créer plus de challenge
- ✅ **Paramètre temps** ajouté pour valoriser l'entraînement

**Fichiers modifiés :**
- `backend/config.py` - `GradeRequirements` class
- `backend/routers/statistics.py` - `calculate_grade()` function
- `frontend/src/config/grades.ts` - Configuration centralisée (nouveau)
- `frontend/src/components/GradeBadge.tsx` - Utilise la nouvelle config
- `frontend/src/components/GradeProgress.tsx` - Affiche les 3 critères

---

### 3. Grade visible dans le Sidebar

**Fonctionnalité :**
- Emoji du grade affiché à côté du username
- Nom du grade affiché sous le badge Premium
- Tooltip au survol montrant le grade complet

**Fichiers modifiés :**
- [frontend/src/components/Sidebar.tsx](frontend/src/components/Sidebar.tsx)
  - Ajout de `userGrade?: string` dans `SidebarProps`
  - Affichage de l'emoji et du texte du grade
  - `GRADE_EMOJIS` mapping pour les icônes

**Exemple visuel :**
```
[A] admin 💎        ← Emoji du grade
⭐ Premium | Platinum  ← Badge + nom du grade
```

---

### 4. Script de modification des statistiques

**Nouveau script : [backend/scripts/modify_user_stats.py](backend/scripts/modify_user_stats.py)**

**Fonctionnalités :**
- ✅ Modifier le nombre de routines complétées
- ✅ Modifier le temps total d'entraînement
- ✅ Modifier la série actuelle (streak)
- ✅ Gestion automatique des sessions dans la DB
- ✅ Support SQLite et PostgreSQL

**Utilisation :**
```bash
cd backend
source venv/bin/activate

# Modifier toutes les stats
python scripts/modify_user_stats.py admin --routines 150 --time 54000 --streak 30

# Modifier uniquement les routines
python scripts/modify_user_stats.py admin --routines 50

# Modifier uniquement le temps (en secondes)
python scripts/modify_user_stats.py admin --time 18000  # 5 heures

# Modifier uniquement la série
python scripts/modify_user_stats.py admin --streak 15
```

**Options :**
- `--routines, -r` : Nombre de routines complétées
- `--time, -t` : Temps total en secondes
- `--streak, -s` : Série actuelle en jours

**Exemples de valeurs :**
```bash
# Atteindre Bronze (10 routines, 5 jours, 1h)
python scripts/modify_user_stats.py admin -r 10 -t 3600 -s 5

# Atteindre Gold (150 routines, 30 jours, 15h)
python scripts/modify_user_stats.py admin -r 150 -t 54000 -s 30

# Atteindre Legend (1000 routines, 200 jours, 100h)
python scripts/modify_user_stats.py admin -r 1000 -t 360000 -s 200
```

---

### 5. Configuration centralisée (Frontend)

**Nouveau fichier : [frontend/src/config/grades.ts](frontend/src/config/grades.ts)**

**Contenu :**
- `GRADE_REQUIREMENTS` - Seuils pour chaque grade
- `GRADE_ORDER` - Ordre des grades
- `GRADE_EMOJIS` - Emojis pour chaque grade
- `GRADE_COLORS` - Couleurs TailwindCSS
- `getNextGrade()` - Obtenir le grade suivant
- `getNextGradeRequirements()` - Obtenir les prérequis du prochain grade

**Avantages :**
- ✅ Source unique de vérité
- ✅ Facile à maintenir
- ✅ TypeScript type-safe
- ✅ Utilisé par tous les composants

---

## Fichiers créés

```
backend/scripts/
└── modify_user_stats.py       # Script de test des statistiques

frontend/src/config/
└── grades.ts                  # Configuration centralisée des grades

frontend/src/components/
├── GradeBadge.tsx             # Badge avec progression (modifié)
├── StatsCard.tsx              # Cartes stats animées (conservé)
├── GradeProgress.tsx          # Barres de progression (conservé)
├── StatsSkeleton.tsx          # Skeleton loader (conservé)
├── ActivityChart.tsx          # ⚠️ Retiré de Statistics.tsx
└── HeatmapCalendar.tsx        # ⚠️ Retiré de Statistics.tsx
```

## Fichiers modifiés

**Backend :**
- [backend/config.py](backend/config.py) - Nouveaux seuils de grades
- [backend/routers/statistics.py](backend/routers/statistics.py) - Calcul de grade avec temps

**Frontend :**
- [frontend/src/components/Sidebar.tsx](frontend/src/components/Sidebar.tsx) - Affichage du grade
- [frontend/src/components/GradeBadge.tsx](frontend/src/components/GradeBadge.tsx) - Support du temps
- [frontend/src/pages/Statistics.tsx](frontend/src/pages/Statistics.tsx) - Simplification V1

---

## Tests effectués

### ✅ Backend
```bash
cd backend
source venv/bin/activate

# Test de modification des stats
python scripts/modify_user_stats.py admin --routines 150 --time 54000 --streak 30

# Vérification du calcul de grade
# → Grade attendu: Gold (150 routines, 30 jours, 15h)
```

### ✅ Frontend
```bash
cd frontend
npm run build

# ✓ 81 modules transformed
# ✓ built in 2.12s
```

---

## Comment tester l'onglet Statistics

### 1. Prérequis

Assurez-vous que votre utilisateur est Premium :
```bash
cd backend
source venv/bin/activate
python scripts/upgrade_admin_to_premium.py  # Si nécessaire
```

### 2. Générer des données de test

```bash
# Exemple 1: Atteindre Bronze
python scripts/modify_user_stats.py admin --routines 10 --time 3600 --streak 5

# Exemple 2: Atteindre Silver
python scripts/modify_user_stats.py admin --routines 50 --time 18000 --streak 15

# Exemple 3: Atteindre Gold
python scripts/modify_user_stats.py admin --routines 150 --time 54000 --streak 30
```

### 3. Lancer l'application

```bash
# Terminal 1: Backend
cd backend
./run_backend.sh

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Vérifier

1. Connectez-vous avec le compte "admin"
2. Le grade devrait apparaître dans le Sidebar (emoji + texte)
3. Allez dans l'onglet **Statistics**
4. Vérifiez :
   - Badge de grade avec cercle de progression
   - Message motivant avec objectifs
   - 3 cartes statistiques animées
   - Système de grades avec barres de progression

---

## Interface Statistics V1

### Composants affichés

```
┌─────────────────────────────────────────────────┐
│ 📊 Statistiques                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  🥉 Bronze ━━━━━━━━━━◯━━━━━━━━━━ 45%          │
│  🎯 Prochain: 🥈 Silver                        │
│  ✨ Encore 40 routines                         │
│  🔥 Encore 10 jours de série                   │
│  ⏱ Encore 4 heures d'entraînement             │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Routines  │  │ Temps     │  │ Meilleure │ │
│  │ complétées│  │ total     │  │ série     │ │
│  │    10     │  │   1h 30m  │  │  5 jours  │ │
│  └───────────┘  └───────────┘  └───────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Système de grades                             │
│  ┌─────────────────────────────────────┐      │
│  │ 🥉 Bronze   ████████████░░░ 75%    │      │
│  │ 🥈 Silver   ████░░░░░░░░░░░ 20%    │      │
│  │ 🥇 Gold     ░░░░░░░░░░░░░░░  0%    │      │
│  │ ...                                 │      │
│  └─────────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Prochaines étapes (V2)

Pour la V2 de Statistics, envisager de réintégrer :
- `ActivityChart.tsx` - Graphique d'activité détaillé (14 jours)
- `HeatmapCalendar.tsx` - Calendrier heatmap (30 jours)
- Modal de détails du jour (avec liste des routines)
- Filtres et interactions avancées

Les composants sont déjà créés et prêts à être intégrés !

---

## Notes importantes

### Compatibilité backend/frontend

Les seuils de grades DOIVENT être identiques entre :
- `backend/config.py` → `GradeRequirements`
- `frontend/src/config/grades.ts` → `GRADE_REQUIREMENTS`

Si vous modifiez l'un, modifiez l'autre !

### Script de test

Le script `modify_user_stats.py` modifie directement la base de données.
⚠️ Utilisez uniquement en développement, pas en production !

### Affichage du grade

Pour afficher le grade dans le Sidebar, vous devez :
1. Charger le grade depuis l'API (déjà fait dans `getUserStats()`)
2. Passer `userGrade={user.grade}` au composant `<Sidebar>`
3. Le Sidebar affichera automatiquement l'emoji + texte

---

## Commandes utiles

```bash
# Modifier les stats d'un utilisateur
python backend/scripts/modify_user_stats.py <username> --routines <N> --time <SEC> --streak <DAYS>

# Upgrade un utilisateur en Premium
python backend/scripts/upgrade_admin_to_premium.py

# Build le frontend
cd frontend && npm run build

# Lancer le backend
cd backend && ./run_backend.sh

# Lancer le frontend en dev
cd frontend && npm run dev
```

---

**Date de création** : 30 octobre 2025
**Version** : V1
**Statut** : ✅ Complété et testé
