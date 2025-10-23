# FortiFlow Frontend

Application web React pour FortiFlow - Interface utilisateur de l'application d'entraînement Fortnite.

## Stack Technique

- **React 19** + **TypeScript** + **Vite**
- **TailwindCSS** pour le styling
- **React Router** pour la navigation
- **Tauri v2** pour l'application desktop native

## Développement

### Installation
```bash
npm install
```

### Mode Web (développement)
```bash
npm run dev
# → http://localhost:5173
# → Utilise backend local (http://localhost:3000)
```

⚠️ **Important:** Le backend doit tourner sur localhost:3000 en mode dev.

### Mode Desktop (Tauri)
```bash
npm run tauri:dev
# → Lance une fenêtre native
# → Backend démarré automatiquement par Tauri
```

**Note:** En mode Tauri dev, le backend FastAPI est lancé automatiquement. Pas besoin de `./run_backend.sh`.

## Build Production

### Build Web
```bash
npm run build
# → Dossier dist/ créé
# → Utilise backend VPS (http://72.61.166.22)
```

### Build Desktop (Tauri)
```bash
npm run tauri:build
# → Crée l'exécutable dans src-tauri/target/release/bundle/
# → Utilise backend VPS (http://72.61.166.22)
```

**Important:** L'app buildée pointe vers le backend VPS, pas localhost.

## Environnements

L'app peut fonctionner avec deux backends différents :

| Mode | Backend | Fichier |
|------|---------|---------|
| **Dev** | `http://localhost:3000` | `.env.development` |
| **Prod** | `http://72.61.166.22` | `.env.production` |

Voir [ENVIRONMENTS.md](ENVIRONMENTS.md) pour plus de détails.

## Structure

```
frontend/
├── src/
│   ├── pages/              # Pages React Router
│   │   ├── RoutinesList.tsx    # Home (/)
│   │   ├── CreateRoutine.tsx   # Créer (/create)
│   │   ├── EditRoutine.tsx     # Éditer (/edit/:id)
│   │   └── PlayRoutine.tsx     # Exécuter (/play/:id)
│   ├── services/
│   │   └── api.ts          # Client API backend
│   ├── types/
│   │   └── index.ts        # Types TypeScript
│   ├── App.tsx             # Router config
│   └── main.tsx            # Entry point
│
├── src-tauri/              # Code Rust Tauri
│   ├── src/lib.rs          # Backend auto-start
│   ├── tauri.conf.json     # Config Tauri
│   └── Cargo.toml          # Dépendances Rust
│
├── .env.development        # Config dev (localhost)
├── .env.production         # Config prod (VPS)
├── ENVIRONMENTS.md         # Doc environnements
└── package.json            # Dépendances npm
```

## Scripts Utiles

### Tests de connexion

Tester la connexion au backend VPS :
```bash
node test-vps-connection.js
```

Tester toutes les opérations CRUD :
```bash
node test-crud-vps.js
```

### Autres commandes

```bash
# Linter
npm run lint

# Preview du build
npm run preview

# Clean rebuild Tauri
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

## Configuration Backend

L'URL du backend est configurée via `VITE_API_URL` dans `src/services/api.ts` :

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

**Pour changer temporairement de backend en dev :**
```bash
VITE_API_URL=http://72.61.166.22 npm run dev
```

## Tauri

### Backend Auto-Start

Tauri démarre automatiquement le backend FastAPI au lancement de l'app :

1. Vérifie que le port 3000 est libre
2. Localise le dossier `backend/`
3. Crée un venv Python si nécessaire
4. Installe les dépendances
5. Lance uvicorn sur localhost:3000
6. Tue le backend à la fermeture de l'app

Voir [src-tauri/src/lib.rs](src-tauri/src/lib.rs) pour les détails.

### Prérequis Tauri

- **Rust** : https://www.rust-lang.org/tools/install
- **System dependencies** : Voir [docs/setup/TAURI_SETUP.md](../docs/setup/TAURI_SETUP.md)

## Documentation

- **Architecture** : [/CLAUDE.md](../CLAUDE.md)
- **Environnements** : [ENVIRONMENTS.md](ENVIRONMENTS.md)
- **Setup Tauri** : [docs/setup/TAURI_SETUP.md](../docs/setup/TAURI_SETUP.md)
- **Backend** : [backend/README.md](../backend/README.md)

## Troubleshooting

### Backend inaccessible

```bash
# Vérifier que le backend tourne
curl http://localhost:3000/health  # En dev
curl http://72.61.166.22/health    # En prod
```

### Build Tauri échoue

```bash
# Nettoyer et rebuild
cd src-tauri
cargo clean
cd ..
rm -rf node_modules dist
npm install
npm run tauri:build
```

### App ne trouve pas le backend

Vérifier dans la console (F12) :
```javascript
console.log(import.meta.env.VITE_API_URL);
```

## Production

L'application buildée utilise **automatiquement** le backend VPS :
- URL : `http://72.61.166.22`
- Pas besoin de backend local
- Toutes les données sont centralisées

Pour modifier l'URL de production, éditer `.env.production`.

## Prochaines Étapes

- [ ] Ajouter authentification (login/register)
- [ ] Implémenter mode offline avec cache
- [ ] Ajouter sync bidirectionnelle
- [ ] Dark mode
- [ ] Tests E2E (Playwright/Cypress)
