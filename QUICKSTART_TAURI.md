# 🚀 Démarrage rapide - FortiFlow Desktop (Tauri)

## Installation rapide (Linux/macOS)

```bash
# 1. Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 2. Installer les dépendances système (Ubuntu/Debian)
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev

# 3. Aller dans le dossier frontend et installer les dépendances
cd frontend
npm install

# 4. Lancer l'application desktop
npm run tauri:dev
```

## Installation rapide (Windows)

```powershell
# 1. Installer Rust depuis https://rustup.rs/
# Télécharger et exécuter rustup-init.exe

# 2. Installer Node.js si ce n'est pas déjà fait
# https://nodejs.org/

# 3. Ouvrir un nouveau terminal et aller dans le dossier frontend
cd frontend
npm install

# 4. Lancer l'application desktop
npm run tauri:dev
```

## Que fait `npm run tauri:dev` ?

1. **Compile l'application Rust** (première fois uniquement, ~5-10 min)
2. **Démarre automatiquement le backend FastAPI** sur localhost:3000
3. **Lance le serveur Vite** pour le frontend
4. **Ouvre une fenêtre native** avec l'application

**Vous n'avez pas besoin de lancer le backend manuellement !**

## Vérifier que tout fonctionne

Après le lancement, vous devriez voir:
- ✅ Une fenêtre native FortiFlow s'ouvre
- ✅ L'interface React est affichée
- ✅ Vous pouvez créer et gérer des routines
- ✅ Dans le terminal: logs du backend FastAPI

## Commandes essentielles

```bash
# Développement
npm run tauri:dev          # Lance l'app desktop en mode dev

# Production
npm run tauri:build        # Crée un exécutable distributable

# Web classique (sans Tauri)
npm run dev                # Vite uniquement (nécessite backend séparé)
```

## Différence Mode Web vs Mode Desktop

| Mode | Commande | Backend | Fenêtre |
|------|----------|---------|---------|
| **Web** | `npm run dev` | Manuel (`./run_backend.sh`) | Navigateur |
| **Desktop** | `npm run tauri:dev` | Automatique | Native Tauri |

## Troubleshooting

### ❌ "Rust not found"
```bash
# Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### ❌ "webkit2gtk not found" (Linux)
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

### ❌ Le backend ne démarre pas
Vérifiez:
- Python 3 est installé: `python3 --version`
- Port 3000 est libre: `lsof -i :3000` ou `netstat -an | grep 3000`
- Le dossier `backend/` existe avec `main.py`

### ❌ L'app se ferme immédiatement
Regardez les logs dans le terminal pour identifier l'erreur.

## Build de production

```bash
cd frontend
npm run tauri:build
```

L'exécutable sera dans: `frontend/src-tauri/target/release/bundle/`

Format selon votre OS:
- **Linux**: `.deb`, `.AppImage`
- **macOS**: `.dmg`, `.app`
- **Windows**: `.msi`, `.exe`

## Documentation complète

Pour plus de détails, consultez:
- [TAURI_SETUP.md](TAURI_SETUP.md) - Guide d'installation complet
- [CLAUDE.md](CLAUDE.md) - Architecture technique
- [readme.md](readme.md) - Vision du projet

## Support

En cas de problème:
1. Vérifiez que Rust est installé: `rustc --version`
2. Vérifiez que Python 3 est installé: `python3 --version`
3. Consultez les logs dans le terminal
4. Vérifiez [TAURI_SETUP.md](TAURI_SETUP.md) pour votre OS
