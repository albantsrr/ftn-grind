# Intégration des badges PNG

## Vue d'ensemble

Intégration des badges PNG personnalisés pour remplacer les emojis dans l'affichage des grades.

## Fichiers de badges

**Emplacement :** `frontend/public/badges/`

```
frontend/public/badges/
├── bronze.png     (82 KB)
├── silver.png     (37 KB)
├── gold.png       (79 KB)
├── platinum.png   (99 KB)
├── diamond.png    (102 KB)
└── legend.png     (98 KB)
```

**Note :** Le fichier `platinium.png` a été renommé en `platinum.png` pour correspondre à l'orthographe correcte.

---

## Changements effectués

### 1. Configuration des badges

**Fichier :** [frontend/src/config/grades.ts](frontend/src/config/grades.ts)

**Ajout :**
```typescript
export const GRADE_BADGES: Record<GradeName, string> = {
  Bronze: '/badges/bronze.png',
  Silver: '/badges/silver.png',
  Gold: '/badges/gold.png',
  Platinum: '/badges/platinum.png',
  Diamond: '/badges/diamond.png',
  Legend: '/badges/legend.png'
};
```

Les chemins commencent par `/` car les fichiers sont dans `public/`, ce qui les rend accessibles directement.

---

### 2. Sidebar - Badge à côté du username

**Fichier :** [frontend/src/components/Sidebar.tsx](frontend/src/components/Sidebar.tsx)

**Changements :**
```tsx
// Import
import { GRADE_BADGES, type GradeName } from '../config/grades';

// Remplacement de l'emoji par l'image
{isPremium && userGrade && (
  <img
    src={GRADE_BADGES[userGrade as GradeName]}
    alt={`${userGrade} badge`}
    title={`Grade: ${userGrade}`}
    className="w-5 h-5 object-contain"
  />
)}
```

**Résultat :**
- Badge PNG 20×20px à côté du username
- Tooltip au survol montrant le nom du grade
- Alignement parfait avec le texte

---

### 3. GradeBadge - Badge principal avec animation

**Fichier :** [frontend/src/components/GradeBadge.tsx](frontend/src/components/GradeBadge.tsx)

**Changements :**
```tsx
// Import
import { GRADE_BADGES } from '../config/grades';

// Badge principal (64×64px avec animation bounce)
<img
  src={GRADE_BADGES[grade as GradeName]}
  alt={`${grade} badge`}
  className="w-16 h-16 object-contain animate-bounce-slow drop-shadow-2xl"
/>

// Badge du prochain grade (20×20px)
<img
  src={GRADE_BADGES[nextGradeName as GradeName]}
  alt={`${nextGradeName} badge`}
  className="w-5 h-5 object-contain inline-block"
/>
```

**Résultat :**
- Badge principal 64×64px avec animation bounce
- Drop shadow pour l'effet 3D
- Badge du prochain objectif 20×20px inline

---

### 4. GradeProgress - Badges dans la liste

**Fichier :** [frontend/src/components/GradeProgress.tsx](frontend/src/components/GradeProgress.tsx)

**Changements :**
```tsx
// Import et configuration
import { GRADE_REQUIREMENTS, GRADE_BADGES, GRADE_COLORS, GRADE_ORDER } from '../config/grades';

const GRADES = GRADE_ORDER.map(name => ({
  name,
  badge: GRADE_BADGES[name],
  routines: GRADE_REQUIREMENTS[name].routines,
  streak: GRADE_REQUIREMENTS[name].streak,
  timeHours: GRADE_REQUIREMENTS[name].timeHours,
  color: GRADE_COLORS[name]
}));

// Affichage du badge (48×48px)
<img
  src={grade.badge}
  alt={`${grade.name} badge`}
  className={`w-12 h-12 object-contain transition-transform duration-300
    ${isCurrentGrade ? 'animate-bounce-slow scale-110' : ''}`}
/>
```

**Résultat :**
- Badge 48×48px pour chaque grade
- Animation bounce + scale pour le grade actuel
- Transition smooth

**Mise à jour des prérequis :**
- Affichage des 3 critères : `routines · jours · heures`
- Call-to-action avec les 3 critères manquants

---

## Avantages des badges PNG

### ✅ Visuels
- **Meilleurs graphismes** : badges personnalisés vs emojis standards
- **Cohérence** : même style sur tous les OS/navigateurs
- **Taille flexible** : 20px dans Sidebar, 48px dans liste, 64px dans badge principal
- **Animations** : bounce, scale, drop-shadow

### ✅ Techniques
- **Performance** : images optimisées (37-102 KB)
- **Accessibilité** : alt text descriptif sur toutes les images
- **Maintenance** : chemins centralisés dans `grades.ts`
- **Type-safe** : TypeScript vérifie les chemins

### ✅ UX
- **Reconnaissance** : badges visuellement distincts
- **Hiérarchie** : tailles différentes selon l'importance
- **Motivation** : visuels attrayants pour encourager la progression

---

## Affichage des badges

### Sidebar
```
┌─────────────────────────┐
│ [A] admin 💎            │  ← Badge 20×20px
│ ⭐ Premium | Platinum   │
└─────────────────────────┘
```

### GradeBadge (Statistics)
```
┌──────────────────────────────────────────┐
│ Votre grade actuel                       │
│ [💎 64×64] Platinum         ◯ 75%       │
│                                          │
│ 🎯 Prochain: [💠 20×20] Diamond        │
│ ✨ Encore 150 routines                  │
│ 🔥 Encore 30 jours                      │
│ ⏱ Encore 15h                            │
└──────────────────────────────────────────┘
```

### GradeProgress
```
┌──────────────────────────────────────────┐
│ [🥉 48×48] Bronze                    75% │
│ 10 routines · 5 jours · 1h              │
│ ████████████░░░░                         │
│ 🎯 Objectif: 2 routines + 1 jour        │
├──────────────────────────────────────────┤
│ [🥈 48×48] Silver                    45% │
│ 50 routines · 15 jours · 5h             │
│ ████████░░░░░░░░                         │
└──────────────────────────────────────────┘
```

---

## Tailles des badges

| Composant | Taille | Usage |
|-----------|--------|-------|
| **Sidebar** | 20×20px | Badge à côté du username |
| **GradeBadge (objectif)** | 20×20px | Badge du prochain grade |
| **GradeProgress** | 48×48px | Liste des grades |
| **GradeBadge (principal)** | 64×64px | Badge actuel avec animation |

---

## Animations

### Bounce (bounce-slow)
```css
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
animation: bounce-slow 2s infinite;
```

**Appliqué à :**
- Badge principal dans GradeBadge
- Badge du grade actuel dans GradeProgress

### Scale
```css
scale-110  /* 110% de la taille normale */
```

**Appliqué à :**
- Badge du grade actuel dans GradeProgress

### Drop Shadow
```css
drop-shadow-2xl  /* Ombre portée forte */
```

**Appliqué à :**
- Badge principal dans GradeBadge

---

## Compatibilité

### Formats supportés
- ✅ **PNG** : transparence, qualité, tailles variées
- ✅ **Tous navigateurs** : Chrome, Firefox, Safari, Edge
- ✅ **Dark mode** : arrière-plan transparent

### Responsive
- ✅ Les badges s'adaptent avec `object-contain`
- ✅ Ratio d'aspect préservé
- ✅ Pas de déformation

---

## Maintenance

### Ajouter un nouveau grade

1. **Ajouter le badge PNG :**
   ```bash
   cp nouveau-grade.png frontend/public/badges/
   ```

2. **Mettre à jour `grades.ts` :**
   ```typescript
   export const GRADE_BADGES: Record<GradeName, string> = {
     // ...
     NouveauGrade: '/badges/nouveau-grade.png'
   };
   ```

3. **Les composants utiliseront automatiquement le nouveau badge !**

### Remplacer un badge

1. **Remplacer le fichier PNG :**
   ```bash
   cp nouveau-platinum.png frontend/public/badges/platinum.png
   ```

2. **Aucun changement de code nécessaire !**
   - Le chemin reste le même
   - L'image est mise à jour automatiquement

---

## Build et déploiement

### Build
```bash
cd frontend
npm run build

# ✓ 81 modules transformed
# ✓ built in 1.97s
```

Les badges sont automatiquement copiés dans `dist/badges/` lors du build.

### Production
Les badges sont servis en tant qu'assets statiques :
- **Dev** : `http://localhost:5173/badges/bronze.png`
- **Prod** : `https://your-domain.com/badges/bronze.png`

---

## Tests effectués

### ✅ Build
```bash
npm run build
# ✓ Success (1.97s)
```

### ✅ TypeScript
- Tous les imports vérifiés
- Types GradeName respectés
- Pas d'erreurs de compilation

### ✅ Affichage
- Sidebar : badge 20×20px à côté du username ✓
- GradeBadge : badge 64×64px avec animation ✓
- GradeProgress : badges 48×48px dans la liste ✓
- Tous les grades affichés correctement ✓

---

## Fichiers modifiés

```
frontend/
├── public/
│   └── badges/
│       ├── bronze.png      (nouveau)
│       ├── silver.png      (nouveau)
│       ├── gold.png        (nouveau)
│       ├── platinum.png    (nouveau)
│       ├── diamond.png     (nouveau)
│       └── legend.png      (nouveau)
├── src/
│   ├── config/
│   │   └── grades.ts       (modifié - ajout GRADE_BADGES)
│   └── components/
│       ├── Sidebar.tsx     (modifié - badge image)
│       ├── GradeBadge.tsx  (modifié - badge image)
│       └── GradeProgress.tsx (modifié - badge images)
```

---

## Prochaines étapes (optionnel)

### V2 - Améliorations possibles
- Ajouter des badges animés (GIF/WebP)
- Effet hover spécifique sur les badges
- Badges avec particules/étoiles
- Badge "New!" pour nouveaux grades débloqués

### Optimisation
- Convertir en WebP pour réduire la taille
- Lazy loading des badges non visibles
- Sprite sheet pour tous les badges

---

**Date d'intégration :** 30 octobre 2025
**Version :** V1
**Statut :** ✅ Complété et testé
