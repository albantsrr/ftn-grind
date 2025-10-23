# Gestion des Environnements Frontend

L'application FortiFlow peut fonctionner avec deux backends différents selon le mode :

## Fichiers d'environnement

### `.env.development` (Développement local)
```
VITE_API_URL=http://localhost:3000
```
Utilisé quand tu lances `npm run dev` ou `npm run tauri:dev`

### `.env.production` (Production VPS)
```
VITE_API_URL=http://72.61.166.22
```
Utilisé quand tu builds l'app avec `npm run build` ou `npm run tauri:build`

## Utilisation

### Mode Développement (Backend Local)

1. Démarrer le backend local :
```bash
cd backend
./run_backend.sh
# → API sur http://localhost:3000
```

2. Lancer le frontend :
```bash
cd frontend
npm run dev
# → Utilise automatiquement .env.development (localhost:3000)
```

### Mode Développement (Backend VPS)

Si tu veux tester avec le backend VPS pendant le développement :

```bash
cd frontend

# Option 1: Créer un fichier .env.development.local
echo "VITE_API_URL=http://72.61.166.22" > .env.development.local

# Option 2: Variable d'environnement temporaire
VITE_API_URL=http://72.61.166.22 npm run dev
```

### Mode Production (Build Tauri)

L'app buildée utilise **automatiquement** le backend VPS :

```bash
cd frontend
npm run tauri:build
# → Utilise .env.production (http://72.61.166.22)
```

L'exécutable créé pointera vers le VPS, pas vers localhost.

## Tester la connexion VPS

```bash
cd frontend
node test-vps-connection.js
```

Cela vérifie que :
- Le backend VPS est accessible
- Les endpoints API fonctionnent
- Les données sont bien récupérées

## Ordre de priorité des fichiers .env

Vite charge les fichiers dans cet ordre (du moins au plus prioritaire) :

1. `.env` - Commun à tous les modes
2. `.env.local` - Local, ignoré par git
3. `.env.[mode]` - Spécifique au mode (dev ou prod)
4. `.env.[mode].local` - Local + mode, ignoré par git

**Fichiers committés :**
- ✅ `.env.example`
- ✅ `.env.development`
- ✅ `.env.production`

**Fichiers ignorés par git :**
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.development.local`
- ❌ `.env.production.local`

## Résumé

| Commande | Backend utilisé | Fichier env |
|----------|----------------|-------------|
| `npm run dev` | localhost:3000 | `.env.development` |
| `npm run tauri:dev` | localhost:3000 | `.env.development` |
| `npm run build` | VPS (72.61.166.22) | `.env.production` |
| `npm run tauri:build` | VPS (72.61.166.22) | `.env.production` |

## Troubleshooting

### L'app ne trouve pas le backend

```bash
# Vérifier quelle URL est utilisée
# Dans le navigateur (F12 Console) ou dans l'app :
console.log(import.meta.env.VITE_API_URL);
```

### Changer temporairement de backend

```bash
# Forcer l'utilisation du VPS en dev
VITE_API_URL=http://72.61.166.22 npm run dev

# Forcer l'utilisation de localhost en build (pour test)
VITE_API_URL=http://localhost:3000 npm run build
```

### Backend VPS inaccessible

```bash
# Vérifier que le VPS est en ligne
curl http://72.61.166.22/health

# Vérifier les logs du backend
ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs backend"
```

## Prochaines étapes

Quand tu auras un domaine :
1. Acheter un domaine (ex: fortiflow.com)
2. Configurer SSL (Let's Encrypt)
3. Modifier `.env.production` :
   ```
   VITE_API_URL=https://api.fortiflow.com
   ```
