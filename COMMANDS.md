# 📋 Référence des commandes FortiFlow

## 🚀 Démarrage rapide

### Mode Desktop (Tauri) - Recommandé
```bash
cd frontend
npm run tauri:dev
```
→ Lance l'app desktop avec backend automatique

### Mode Web (Développement)
```bash
# Terminal 1 - Backend
cd backend
./run_backend.sh

# Terminal 2 - Frontend
cd frontend
npm run dev
```
→ Backend sur localhost:3000, Frontend sur localhost:5173

## 📦 Backend (Python FastAPI)

### Installation
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Lancement
```bash
# Avec script
./run_backend.sh

# Manuel
uvicorn main:app --reload --host 127.0.0.1 --port 3000
```

### Tests
```bash
pytest                    # Tous les tests
pytest tests/test_routines.py  # Tests spécifiques
pytest -v                 # Mode verbose
```

### Accès
- API: http://localhost:3000
- Docs interactive: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc
- Health check: http://localhost:3000/health

## 🎨 Frontend (React + Vite)

### Installation
```bash
cd frontend
npm install
```

### Développement
```bash
npm run dev              # Serveur de dev Vite
npm run build            # Build de production
npm run preview          # Prévisualiser le build
npm run lint             # Linter ESLint
```

### Accès
- Dev server: http://localhost:5173

## 🖥️ Application Desktop (Tauri)

### Prérequis
```bash
# Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Linux: installer les dépendances système
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev
```

### Développement
```bash
cd frontend
npm run tauri:dev        # Lance l'app desktop en mode dev
```

### Production
```bash
npm run tauri:build      # Compile l'exécutable
```

→ Sortie dans `frontend/src-tauri/target/release/bundle/`

### Nettoyage
```bash
cd frontend/src-tauri
cargo clean              # Nettoie les artifacts Rust
```

## 🗄️ Base de données

### Location
```
backend/fortiflow.db
```

### Réinitialiser
```bash
cd backend
rm fortiflow.db
# Relancer le backend, les tables seront recréées automatiquement
```

### Inspecter
```bash
cd backend
sqlite3 fortiflow.db

# Commandes SQLite
.tables                  # Lister les tables
.schema routines         # Voir le schéma
SELECT * FROM routines;  # Query
.quit                    # Quitter
```

## 🔧 Maintenance

### Mettre à jour les dépendances

**Backend:**
```bash
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt
```

**Frontend:**
```bash
cd frontend
npm update
npm outdated             # Voir les packages obsolètes
```

**Tauri:**
```bash
cd frontend
npm update @tauri-apps/cli @tauri-apps/api
```

### Vérifier les versions
```bash
# Backend
python3 --version
pip list

# Frontend
node --version
npm --version
npm list

# Tauri
rustc --version
cargo --version
```

## 🐛 Debug

### Logs Backend
```bash
# Les logs sont dans le terminal où uvicorn tourne
# Niveau de log défini dans backend/main.py
```

### Logs Frontend
```bash
# Console du navigateur (F12)
# Ou console dans DevTools Tauri
```

### Logs Tauri
```bash
# Visible dans le terminal lors de tauri:dev
# Pour plus de détails:
RUST_LOG=debug npm run tauri:dev
```

### Vérifier les ports
```bash
# Linux/macOS
lsof -i :3000            # Vérifier qui utilise le port 3000
lsof -i :5173            # Vérifier qui utilise le port 5173

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

### Tuer les processus
```bash
# Linux/macOS
pkill -f uvicorn         # Tuer le backend
pkill -f vite            # Tuer Vite

# Windows
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

## 📊 Commandes Git

### Status et commit
```bash
git status
git add .
git commit -m "feat: descriptive message"
git push
```

### Branches
```bash
git branch                    # Lister les branches
git checkout -b feature/nom   # Créer et changer de branche
git checkout main             # Retour à main
git merge feature/nom         # Merger une branche
```

## 🧪 Tests et qualité

### Backend
```bash
cd backend
pytest                        # Tous les tests
pytest --cov=.                # Avec coverage
pytest -v -s                  # Verbose avec print()
```

### Frontend
```bash
cd frontend
npm run lint                  # ESLint
npm run lint -- --fix         # Fix automatique
```

## 🏗️ Build complet

### Pour distribuer l'application
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Build Tauri (inclut le frontend)
npm run tauri:build

# L'exécutable est dans:
# frontend/src-tauri/target/release/bundle/
```

## 📋 Checklist avant release

- [ ] Tests backend passent: `pytest`
- [ ] Lint frontend passe: `npm run lint`
- [ ] Build frontend réussit: `npm run build`
- [ ] App Tauri lance: `npm run tauri:dev`
- [ ] Backend démarre automatiquement
- [ ] Toutes les fonctionnalités marchent
- [ ] Base de données persiste correctement
- [ ] Build Tauri réussit: `npm run tauri:build`

## 🆘 En cas de problème

1. **Vérifier les prérequis**
   - Python 3.8+
   - Node.js 18+
   - Rust (pour Tauri)

2. **Nettoyer et réinstaller**
   ```bash
   # Backend
   rm -rf venv/
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Frontend
   rm -rf node_modules/
   npm install

   # Tauri
   cd src-tauri && cargo clean
   ```

3. **Consulter la documentation**
   - [TAURI_SETUP.md](TAURI_SETUP.md)
   - [CLAUDE.md](CLAUDE.md)
   - [readme.md](readme.md)

---

**Commande la plus utilisée:**
```bash
cd frontend && npm run tauri:dev
```

**Pour le développement web rapide:**
```bash
# Terminal 1
cd backend && ./run_backend.sh

# Terminal 2
cd frontend && npm run dev
```
