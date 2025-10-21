# 📦 Configuration de la Distribution FortiFlow

Ce guide vous explique comment configurer la distribution de FortiFlow avec téléchargement automatique.

## ✅ Ce qui a été configuré

### 1. Configuration Tauri pour Windows
- ✅ Bundle Windows MSI activé dans `tauri.conf.json`
- ✅ Ressources backend incluses automatiquement
- ✅ Métadonnées (publisher, copyright, description)
- ✅ Icônes Windows (`.ico`) déjà présentes

### 2. GitHub Actions
- ✅ Workflow de release automatique (`.github/workflows/release.yml`)
  - Build Windows, Linux et macOS en parallèle
  - Génère MSI, AppImage, DEB, DMG
  - Crée une draft release sur GitHub
- ✅ Workflow GitHub Pages (`.github/workflows/pages.yml`)
  - Deploy automatique de la page de téléchargement

### 3. Page de téléchargement
- ✅ Landing page responsive (`docs/index.html`)
  - Design moderne avec gradient
  - Bouton de téléchargement Windows
  - Détection automatique de la plateforme
  - Informations sur les fonctionnalités

### 4. Scripts et documentation
- ✅ Script automatique de release (`scripts/prepare-release.sh`)
- ✅ Guide complet (`RELEASE.md`)
- ✅ Guide rapide (`QUICK_RELEASE.md`)

## 🚀 Prochaines étapes (à faire par vous)

### Étape 1 : Activer GitHub Pages (2 minutes)

1. Aller sur votre repository GitHub
2. **Settings** > **Pages** (menu latéral)
3. **Source** : Deploy from a branch
4. **Branch** : `main` (ou `master`)
5. **Folder** : `/docs`
6. Cliquer sur **Save**

Attendez 1-2 minutes, votre page sera sur :
```
https://<votre-username>.github.io/ftn-grind/
```

### Étape 2 : Personnaliser la page de téléchargement (3 minutes)

Éditer `docs/index.html` et remplacer **3 occurrences** de `votre-utilisateur` par votre vrai username GitHub :

```bash
# Rechercher les lignes avec "votre-utilisateur"
grep -n "votre-utilisateur" docs/index.html

# Ou utiliser sed pour remplacer automatiquement
sed -i 's/votre-utilisateur/VOTRE_VRAI_USERNAME/g' docs/index.html
```

Les lignes à modifier :
- Ligne ~119 : URL de téléchargement
- Ligne ~127 : Lien vers toutes les versions
- Ligne ~141 : Lien vers le repository

Puis commit :
```bash
git add docs/index.html
git commit -m "docs: personalize download page"
git push
```

### Étape 3 : Créer votre première release (5 minutes)

#### Option A : Avec le script (recommandé)

```bash
# Rendre le script exécutable si nécessaire
chmod +x scripts/prepare-release.sh

# Préparer la v0.1.0
./scripts/prepare-release.sh 0.1.0

# Le script va :
# 1. Mettre à jour les versions
# 2. Créer un commit
# 3. Créer le tag v0.1.0
# 4. Pousser sur GitHub
```

#### Option B : Manuellement

```bash
# 1. Créer un tag
git tag v0.1.0
git push origin main
git push origin v0.1.0

# Les versions sont déjà à 0.1.0 dans les fichiers
```

### Étape 4 : Surveiller le build (10-15 minutes)

1. Aller sur : `https://github.com/<votre-username>/ftn-grind/actions`
2. Le workflow "Release FortiFlow" démarre automatiquement
3. Attendre que les 4 jobs (Windows, Linux, macOS x2) se terminent
4. Vérifier qu'ils sont tous verts ✅

### Étape 5 : Publier la release (1 minute)

1. Aller sur : `https://github.com/<votre-username>/ftn-grind/releases`
2. Vous verrez une **Draft release v0.1.0**
3. Cliquer sur **Edit**
4. Vérifier les fichiers attachés :
   - `FortiFlow_0.1.0_x64_en-US.msi` ✅
   - AppImage et DEB pour Linux ✅
   - DMG pour macOS ✅
5. Cliquer sur **Publish release**

### Étape 6 : Tester le téléchargement

1. Aller sur votre page : `https://<votre-username>.github.io/ftn-grind/`
2. Cliquer sur **Télécharger pour Windows**
3. Le fichier MSI devrait se télécharger
4. Tester l'installation sur Windows

## 📋 Checklist configuration complète

- [ ] GitHub Pages activé
- [ ] URL personnalisée dans `docs/index.html`
- [ ] Première release v0.1.0 créée
- [ ] Build GitHub Actions réussi
- [ ] Release publiée avec fichiers MSI/DMG/AppImage
- [ ] Page de téléchargement accessible
- [ ] Bouton de téléchargement fonctionne
- [ ] Installation Windows testée

## 🎯 Workflow futur pour les prochaines releases

Pour créer v0.2.0, v1.0.0, etc. :

```bash
# 1. Développer vos features
# ...

# 2. Préparer la release
./scripts/prepare-release.sh 0.2.0

# 3. Attendre le build sur GitHub Actions

# 4. Publier la release sur GitHub

# C'est tout ! 🎉
```

## 🔐 Signature de code (Optionnel - Avancé)

Pour éviter le warning "Éditeur inconnu" sur Windows :

### Option 1 : Certificat auto-signé Tauri (Gratuit)

```bash
# Installer tauri-cli
cargo install tauri-cli

# Générer la clé
tauri signer generate -w ~/.tauri/fortiflow.key

# Ajouter les secrets GitHub :
# TAURI_SIGNING_PRIVATE_KEY
# TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

### Option 2 : Certificat Windows EV (Payant ~400€/an)

Pour une signature reconnue par Windows, acheter un certificat auprès de :
- DigiCert
- Sectigo
- GlobalSign

## 📊 Statistiques de téléchargement

GitHub ne fournit pas de stats automatiques. Pour tracker les téléchargements :

### Option 1 : GitHub API
```bash
# Voir les stats d'une release
curl https://api.github.com/repos/<username>/ftn-grind/releases
```

### Option 2 : Badge dans README
Ajouter un badge avec le nombre de téléchargements :
```markdown
![GitHub Downloads](https://img.shields.io/github/downloads/<username>/ftn-grind/total)
```

## 🐛 Problèmes courants

### GitHub Actions échoue

**Erreur :** "WiX not found"
- WiX est normalement pré-installé sur `windows-latest`
- Attendre que GitHub mette à jour les runners

**Erreur :** Python dependencies fail
- Vérifier `backend/requirements.txt`
- S'assurer que toutes les versions sont compatibles

### Page GitHub Pages ne s'affiche pas

1. Vérifier Settings > Pages est configuré
2. Attendre 2-3 minutes après activation
3. Vérifier que `docs/index.html` existe dans la branche main
4. Regarder Actions > pages-build-deployment

### Le MSI ne s'installe pas

**"Windows a protégé votre ordinateur"**
- Normal pour les apps non signées
- Cliquer "Informations complémentaires" > "Exécuter quand même"

**Solution :** Signer le code (voir section ci-dessus)

## 📞 Support

- Guide complet : [RELEASE.md](RELEASE.md)
- Guide rapide : [QUICK_RELEASE.md](QUICK_RELEASE.md)
- Issues GitHub : `https://github.com/<votre-username>/ftn-grind/issues`

---

**Prochaine étape recommandée :** Activer GitHub Pages (Étape 1 ci-dessus) 🚀
