# 📦 Guide de Release FortiFlow

Ce document explique comment créer et publier une nouvelle version de FortiFlow pour Windows.

## 🎯 Vue d'ensemble

FortiFlow utilise :
- **Tauri v2** pour créer des installateurs natifs Windows (MSI)
- **GitHub Actions** pour automatiser les builds multi-plateformes
- **GitHub Pages** pour héberger la page de téléchargement
- **GitHub Releases** pour distribuer les fichiers

## 📋 Prérequis

### Pour build local (Windows)
- **Rust** : Installation via rustup
  ```bash
  # Windows (PowerShell)
  irm https://sh.rustup.rs -useb | iex
  ```
- **WiX Toolset 3.11** : Pour créer les installateurs MSI
  ```bash
  # Télécharger depuis : https://github.com/wixtoolset/wix3/releases
  # Ou via winget :
  winget install WiX.Toolset
  ```
- **Node.js 18+** et **Python 3.12+**

### Pour release automatique
- Compte GitHub avec permissions d'écriture sur le repository
- GitHub Pages activé (voir "Configuration GitHub Pages" ci-dessous)

## 🚀 Processus de Release

### Option 1 : Release Automatique via GitHub Actions (Recommandé)

#### 1. Préparer la version

```bash
# 1. Mettre à jour le numéro de version
# Éditer frontend/src-tauri/tauri.conf.json
# Changer "version": "0.1.0" en "version": "0.2.0"

# Éditer frontend/src-tauri/Cargo.toml
# Changer version = "0.1.0" en version = "0.2.0"

# Éditer frontend/package.json
# Changer "version": "0.1.0" en "version": "0.2.0"
```

#### 2. Commit et tag

```bash
git add .
git commit -m "chore: bump version to v0.2.0"
git push

# Créer le tag
git tag v0.2.0
git push origin v0.2.0
```

#### 3. Surveiller le build

- Aller sur `https://github.com/<votre-utilisateur>/ftn-grind/actions`
- Le workflow "Release FortiFlow" se lance automatiquement
- Les builds pour Windows, Linux et macOS sont créés en parallèle
- Durée estimée : 10-15 minutes

#### 4. Publier la release

- Aller sur `https://github.com/<votre-utilisateur>/ftn-grind/releases`
- Une draft release est créée automatiquement
- Vérifier les fichiers attachés :
  - `FortiFlow_X.X.X_x64_en-US.msi` (Windows)
  - `FortiFlow_X.X.X_amd64.AppImage` (Linux)
  - `FortiFlow_X.X.X_x64.dmg` (macOS Intel)
  - `FortiFlow_X.X.X_aarch64.dmg` (macOS Apple Silicon)
- Éditer les release notes si nécessaire
- Cliquer sur **"Publish release"**

#### 5. Mettre à jour la page de téléchargement

```bash
# Éditer docs/index.html
# Mettre à jour :
# - Le lien de téléchargement
# - Le numéro de version affiché

git add docs/index.html
git commit -m "docs: update download page for v0.2.0"
git push
```

La page sera automatiquement mise à jour sur GitHub Pages.

---

### Option 2 : Build Local Windows

Pour tester ou créer un build local sans passer par GitHub Actions :

#### 1. Build complet

```bash
# Depuis la racine du projet
cd frontend

# Installer les dépendances si nécessaire
npm install

# Build de production Tauri
npm run tauri:build
```

#### 2. Localiser l'installateur

L'installateur MSI sera créé dans :
```
frontend/src-tauri/target/release/bundle/msi/FortiFlow_0.1.0_x64_en-US.msi
```

#### 3. Tester l'installateur

- Double-cliquer sur le fichier `.msi`
- Suivre l'assistant d'installation
- Vérifier que :
  - L'application s'installe correctement
  - Le backend démarre automatiquement
  - Toutes les fonctionnalités marchent
  - La base de données est créée

#### 4. Distribution manuelle

Vous pouvez distribuer ce fichier `.msi` directement :
- Par email
- Sur un serveur web
- Sur Google Drive / Dropbox
- Via la page GitHub Releases

---

## 🌐 Configuration GitHub Pages

Pour activer la page de téléchargement :

1. Aller dans les **Settings** du repository
2. Section **Pages** (menu latéral gauche)
3. **Source** : Deploy from a branch
4. **Branch** : `main` (ou `master`)
5. **Folder** : `/docs`
6. Cliquer sur **Save**

Votre page sera accessible à :
```
https://<votre-utilisateur>.github.io/ftn-grind/
```

### Personnaliser la page de téléchargement

Éditer `docs/index.html` et modifier :

```html
<!-- Ligne ~119 : Mettre votre username GitHub -->
<a href="https://github.com/VOTRE-USERNAME/ftn-grind/releases/latest/download/FortiFlow_0.1.0_x64_en-US.msi"

<!-- Ligne ~127 : Version actuelle -->
<p class="version">Version actuelle : <strong>v0.2.0</strong></p>

<!-- Ligne ~141 : Lien GitHub -->
<a href="https://github.com/VOTRE-USERNAME/ftn-grind">
```

---

## 🔐 Signature de Code (Optionnel mais Recommandé)

Pour éviter les warnings Windows Defender "Éditeur inconnu" :

### 1. Générer une clé de signature Tauri

```bash
# Installer tauri-cli globalement
cargo install tauri-cli

# Générer une paire de clés
tauri signer generate -w ~/.tauri/fortiflow.key
```

Cela génère :
- Une clé privée (à garder secrète)
- Une clé publique

### 2. Configurer GitHub Secrets

Dans Settings > Secrets and variables > Actions :

- `TAURI_SIGNING_PRIVATE_KEY` : Contenu de la clé privée
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` : Mot de passe de la clé

### 3. Build signé

Le workflow GitHub Actions utilisera automatiquement ces secrets pour signer les builds.

**Note :** Pour une signature Windows reconnue (certificat EV), il faut acheter un certificat auprès d'une autorité (DigiCert, Sectigo, etc.) coûtant ~300-500€/an.

---

## 📊 Checklist Pre-Release

Avant de publier une release, vérifier :

- [ ] Tous les tests backend passent : `cd backend && pytest`
- [ ] Le lint frontend passe : `cd frontend && npm run lint`
- [ ] Le build local réussit : `npm run tauri:build`
- [ ] L'installateur s'installe sans erreur
- [ ] Le backend démarre automatiquement
- [ ] Toutes les fonctionnalités principales marchent :
  - [ ] Créer une routine
  - [ ] Modifier une routine
  - [ ] Supprimer une routine
  - [ ] Exécuter une routine avec timer
  - [ ] Les bips sonores fonctionnent
- [ ] La base de données persiste après redémarrage
- [ ] Numéros de version cohérents dans :
  - [ ] `frontend/src-tauri/tauri.conf.json`
  - [ ] `frontend/src-tauri/Cargo.toml`
  - [ ] `frontend/package.json`
- [ ] CHANGELOG.md mis à jour (si vous en créez un)
- [ ] Page de téléchargement mise à jour avec le bon numéro de version

---

## 🐛 Dépannage

### Le workflow GitHub Actions échoue

**Problème :** Build échoue avec "WiX not found"
- **Solution :** WiX est normalement pré-installé sur `windows-latest`. Attendre que GitHub mette à jour les runners.

**Problème :** Build échoue avec erreur Python
- **Solution :** Vérifier que `requirements.txt` est à jour et que toutes les dépendances sont compatibles.

**Problème :** Upload artifact échoue
- **Solution :** Vérifier que le chemin vers le MSI est correct dans le workflow.

### L'installateur ne fonctionne pas

**Problème :** "Windows a protégé votre ordinateur"
- **Solution :** Cliquer sur "Informations complémentaires" puis "Exécuter quand même". Pour éviter cela, signer le code avec un certificat.

**Problème :** Le backend ne démarre pas
- **Solution :** Vérifier que les ressources backend sont bien bundlées (voir `bundle.resources` dans `tauri.conf.json`)

**Problème :** Base de données non persistante
- **Solution :** Vérifier les permissions d'écriture dans le dossier de l'app (`%APPDATA%/FortiFlow`)

---

## 📈 Workflow de Versioning

FortiFlow suit le **Semantic Versioning** :

- **MAJOR.MINOR.PATCH** (ex: 1.2.3)
  - **MAJOR** : Breaking changes (API incompatible)
  - **MINOR** : Nouvelles fonctionnalités (compatible)
  - **PATCH** : Bug fixes (compatible)

### Exemples

- `v0.1.0` → `v0.1.1` : Bug fix (correction timer)
- `v0.1.0` → `v0.2.0` : Nouvelle feature (export routines)
- `v0.9.0` → `v1.0.0` : Release stable commerciale

---

## 🎯 Roadmap Release

| Version | Objectif | Statut |
|---------|----------|--------|
| v0.1.0 | MVP local (CRUD + Timer) | ✅ En cours |
| v0.2.0 | Statistiques et historique | 📋 Planifié |
| v0.3.0 | Export/Import routines (JSON) | 📋 Planifié |
| v1.0.0 | Version commerciale stable | 🎯 Objectif |

---

## 📞 Support

Pour toute question sur le processus de release :
- GitHub Issues : `https://github.com/<votre-utilisateur>/ftn-grind/issues`
- Email : alban.teissier.dev@gmail.com

---

**Dernière mise à jour :** 2025-10-21
