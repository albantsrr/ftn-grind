# Scripts FortiFlow

Ce dossier contient les scripts utilitaires pour FortiFlow.

## 📜 Scripts disponibles

### `prepare-release.sh`

Script automatique pour préparer une nouvelle release.

**Usage :**
```bash
./scripts/prepare-release.sh <version>
```

**Exemple :**
```bash
./scripts/prepare-release.sh 0.2.0
```

**Ce que fait le script :**
1. ✅ Vérifie que vous êtes sur la branche main/master
2. ✅ Vérifie qu'il n'y a pas de changements non commités
3. ✅ Met à jour les numéros de version dans :
   - `frontend/src-tauri/tauri.conf.json`
   - `frontend/src-tauri/Cargo.toml`
   - `frontend/package.json`
   - `docs/index.html`
4. ✅ Affiche un diff des changements
5. ✅ Crée un commit avec le message : `chore: bump version to vX.X.X`
6. ✅ Crée le tag `vX.X.X`
7. ✅ Propose de pousser sur GitHub

**Avantages :**
- Aucun risque d'oublier de mettre à jour un fichier
- Versions toujours cohérentes
- Process standardisé
- Gain de temps

**Après le script :**
GitHub Actions se déclenche automatiquement et crée les installateurs.

## 🔧 Scripts futurs possibles

Suggestions de scripts à ajouter :

### `build-local.sh`
```bash
#!/bin/bash
# Build local pour tester avant release
cd frontend
npm run tauri:build
echo "Build disponible dans : frontend/src-tauri/target/release/bundle/"
```

### `test-all.sh`
```bash
#!/bin/bash
# Lance tous les tests (backend + frontend)
set -e
echo "🧪 Running backend tests..."
cd backend
pytest -v
cd ..

echo "✨ Running frontend lint..."
cd frontend
npm run lint
cd ..

echo "✅ All tests passed!"
```

### `clean.sh`
```bash
#!/bin/bash
# Nettoie tous les artifacts de build
set -e
echo "🧹 Cleaning build artifacts..."
rm -rf frontend/dist
rm -rf frontend/src-tauri/target
rm -rf backend/__pycache__
rm -rf backend/.pytest_cache
rm -f backend/*.db
echo "✅ Clean complete!"
```

### `setup-dev.sh`
```bash
#!/bin/bash
# Setup environnement de dev complet
set -e

echo "🔧 Setting up development environment..."

# Backend
echo "📦 Installing backend dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo "Run 'npm run tauri:dev' in frontend/ to start the app"
```

N'hésitez pas à créer ces scripts selon vos besoins !
