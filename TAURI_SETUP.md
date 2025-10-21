# Guide d'installation Tauri pour FortiFlow

Ce guide vous aidera à configurer l'environnement nécessaire pour exécuter FortiFlow en tant qu'application desktop avec Tauri.

## Prérequis

### 1. Installer Rust

Tauri nécessite Rust pour compiler l'application native.

**Linux/macOS:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**
Téléchargez et installez depuis: https://rustup.rs/

Après l'installation, redémarrez votre terminal et vérifiez:
```bash
rustc --version
cargo --version
```

### 2. Installer les dépendances système (Linux uniquement)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Fedora:**
```bash
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel
```

**Arch Linux:**
```bash
sudo pacman -S --needed webkit2gtk \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  libappindicator-gtk3 \
  librsvg
```

### 3. Vérifier Python 3

FortiFlow nécessite Python 3.8 ou supérieur:
```bash
python3 --version
```

## Lancer l'application Tauri

### Mode développement

Depuis le dossier `frontend/`:

```bash
# Installer les dépendances npm (première fois uniquement)
npm install

# Lancer l'application desktop
npm run tauri:dev
```

**Ce qui se passe:**
1. Tauri compile le code Rust (première fois uniquement, peut prendre 5-10 minutes)
2. Tauri démarre automatiquement le backend FastAPI
3. Tauri lance le serveur de développement Vite
4. Une fenêtre native s'ouvre avec l'application

**Note:** Le backend démarre automatiquement dans le processus Tauri. Vous n'avez pas besoin de le lancer manuellement avec `./run_backend.sh`.

### Build de production

Pour créer un exécutable distributable:

```bash
cd frontend
npm run tauri:build
```

L'exécutable sera créé dans `frontend/src-tauri/target/release/bundle/`.

## Dépannage

### Erreur: "Rust not found"
Assurez-vous d'avoir installé Rust et redémarré votre terminal.

### Erreur: "webkit2gtk not found" (Linux)
Installez les dépendances système listées ci-dessus.

### Le backend ne démarre pas
Vérifiez que:
- Python 3 est installé
- Le dossier `backend/` contient bien `requirements.txt` et `main.py`
- Le port 3000 n'est pas déjà utilisé

### L'application se ferme immédiatement
Consultez les logs dans la console du terminal. Le backend peut avoir échoué au démarrage.

## Différences avec le mode web

| Aspect | Mode Web (Vite) | Mode Desktop (Tauri) |
|--------|-----------------|----------------------|
| **Backend** | À lancer manuellement | Démarre automatiquement |
| **Fenêtre** | Navigateur | Application native |
| **Installation** | Non nécessaire | Exécutable installable |
| **Performance** | Bonne | Meilleure (WebView natif) |
| **Offline** | Nécessite localhost | Complètement autonome |

## Commandes utiles

```bash
# Lancer en mode dev
npm run tauri:dev

# Build de production
npm run tauri:build

# Nettoyer le cache de build Rust
cd src-tauri && cargo clean

# Mettre à jour les dépendances Tauri
npm update @tauri-apps/cli @tauri-apps/api
```

## Architecture Tauri

```
FortiFlow (Tauri)
├── Frontend (React + Vite)
│   └── Communique via fetch avec localhost:3000
├── Backend (FastAPI)
│   └── Lancé automatiquement par Rust au démarrage
└── Rust (Tauri Core)
    ├── Gère le cycle de vie de l'app
    ├── Lance le backend Python
    └── Crée la fenêtre WebView native
```

## Ressources

- [Documentation Tauri](https://tauri.app/)
- [Guide Tauri v2](https://v2.tauri.app/start/)
- [Troubleshooting Tauri](https://tauri.app/v2/guides/debug/)
