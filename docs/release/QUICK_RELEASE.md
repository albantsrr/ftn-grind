# 🚀 Guide Rapide de Release

## ⚠️ Configuration Initiale (Une Seule Fois)

Avant votre première release avec auto-update, configurez les clés de signature :

👉 **Voir : [SIGNING_KEYS_SETUP.md](SIGNING_KEYS_SETUP.md)**

## Release automatique (Recommandé)

### Méthode simple avec script

```bash
# 1. Préparer la release
./scripts/prepare-release.sh 0.2.0

# 2. Le script va :
#    ✅ Mettre à jour tous les numéros de version
#    ✅ Créer un commit
#    ✅ Créer le tag
#    ✅ Pousser sur GitHub

# 3. Surveiller le build
# GitHub Actions va automatiquement créer les installateurs
# Aller sur : https://github.com/<votre-username>/ftn-grind/actions

# 4. Publier la release
# Aller sur : https://github.com/<votre-username>/ftn-grind/releases
# Cliquer sur "Edit" puis "Publish release"
```

### Méthode manuelle

```bash
# 1. Mettre à jour les versions dans :
#    - frontend/src-tauri/tauri.conf.json
#    - frontend/src-tauri/Cargo.toml
#    - frontend/package.json
#    - docs/index.html

# 2. Commit et tag
git add .
git commit -m "chore: bump version to v0.2.0"
git tag v0.2.0
git push origin main
git push origin v0.2.0

# 3. Le reste est automatique via GitHub Actions
```

## Configuration initiale (une seule fois)

### 1. Activer GitHub Pages

1. Aller dans **Settings** > **Pages**
2. Source : **Deploy from a branch**
3. Branch : **main**, Folder : **/docs**
4. Sauvegarder

Votre page sera sur : `https://<username>.github.io/ftn-grind/`

### 2. Mettre à jour les liens dans docs/index.html

Remplacer `votre-utilisateur` par votre username GitHub réel :

```html
<!-- Ligne ~119 -->
<a href="https://github.com/VOTRE-USERNAME/ftn-grind/releases/latest/...

<!-- Ligne ~127 -->
<a href="https://github.com/VOTRE-USERNAME/ftn-grind/releases">

<!-- Ligne ~141 -->
<a href="https://github.com/VOTRE-USERNAME/ftn-grind">
```

## Build local pour tester

```bash
cd frontend
npm run tauri:build

# L'installateur sera dans :
# frontend/src-tauri/target/release/bundle/msi/FortiFlow_X.X.X_x64_en-US.msi
```

## Checklist avant release

- [ ] Tests passent : `cd backend && pytest`
- [ ] Lint passe : `cd frontend && npm run lint`
- [ ] Build local réussit
- [ ] Toutes les fonctionnalités marchent
- [ ] Numéros de version cohérents

## En cas de problème

Voir [RELEASE.md](RELEASE.md) pour le guide complet avec dépannage.
