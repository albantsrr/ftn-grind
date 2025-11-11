# 🔄 Système de Mise à Jour Automatique FortiFlow

Ce document explique le système de mise à jour automatique intégré dans l'application FortiFlow.

## 📋 Vue d'ensemble

FortiFlow utilise le plugin **Tauri Updater** pour fournir des mises à jour automatiques sécurisées de l'application Windows. Lorsqu'une nouvelle version est publiée sur GitHub, l'application détecte automatiquement la mise à jour et propose à l'utilisateur de la télécharger et l'installer.

## 🔐 Sécurité

Les mises à jour sont **signées cryptographiquement** pour garantir leur authenticité :
- Clé privée : stockée dans les secrets GitHub (`TAURI_SIGNING_PRIVATE_KEY`)
- Clé publique : intégrée dans `tauri.conf.json`
- Signature : générée automatiquement lors du build et vérifiée avant installation

## 🏗️ Architecture

### 1. Configuration Tauri (`tauri.conf.json`)

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/albantsrr/ftn-grind/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### 2. Workflow CI/CD (`.github/workflows/release.yml`)

Le workflow génère automatiquement :
- Le fichier MSI signé (`.msi`)
- La signature (`msi.sig`)
- Le manifeste de mise à jour (`latest.json`)

#### Structure du manifeste `latest.json`

```json
{
  "version": "1.0.3",
  "notes": "See release notes at https://github.com/albantsrr/ftn-grind/releases/tag/v1.0.3",
  "pub_date": "2025-01-15T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkK...",
      "url": "https://github.com/albantsrr/ftn-grind/releases/download/v1.0.3/FortiFlow_1.0.3_x64_en-US.msi"
    }
  }
}
```

### 3. Composant React (`UpdateNotification.tsx`)

Le composant vérifie automatiquement les mises à jour au démarrage :
- **Au lancement** : Vérification silencieuse des mises à jour
- **Si mise à jour disponible** : Affichage d'une notification en bas à droite
- **Téléchargement** : Barre de progression en temps réel
- **Installation** : Redémarrage automatique de l'application

## 📝 Processus de Release avec Auto-Update

### Étape 1 : Préparer la Release

```bash
# Bumper la version (tauri.conf.json, Cargo.toml, package.json)
./scripts/prepare-release.sh 1.0.3

# Vérifier que tout est correct
git status
```

### Étape 2 : Push et Create Tag

```bash
# Push les changements et le tag
git push origin main
git push origin v1.0.3
```

### Étape 3 : Workflow Automatique

Le workflow GitHub Actions (`release.yml`) va :
1. ✅ Build l'application Windows (MSI + EXE)
2. ✅ Signer les fichiers avec la clé privée
3. ✅ Générer le fichier `latest.json`
4. ✅ Créer une release GitHub (draft)
5. ✅ Uploader tous les assets (MSI, signature, manifest)

### Étape 4 : Publier la Release

1. Aller sur GitHub Releases
2. Éditer la draft release créée
3. Vérifier le contenu des release notes
4. **IMPORTANT** : Publier la release (bouton "Publish release")

### Étape 5 : Mise à Jour Automatique

Une fois la release publiée :
- Les utilisateurs qui lancent l'application verront une notification
- Ils peuvent cliquer sur "Mettre à jour" pour télécharger
- L'installation se fait automatiquement
- L'application redémarre avec la nouvelle version

## 🔑 Configuration des Clés de Signature

### Générer les Clés (Une Seule Fois)

```bash
cd frontend/src-tauri

# Générer une paire de clés
npm run tauri signer generate -- -w ~/.tauri/fortiflow.key

# Cela génère :
# - Clé privée : ~/.tauri/fortiflow.key
# - Clé publique : affichée dans le terminal
```

### Configurer les Secrets GitHub

1. Aller sur GitHub → Settings → Secrets and variables → Actions
2. Ajouter deux secrets :

**`TAURI_SIGNING_PRIVATE_KEY`**
```
Contenu complet du fichier ~/.tauri/fortiflow.key
```

**`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`**
```
Le mot de passe choisi lors de la génération (si utilisé)
```

### Ajouter la Clé Publique

Copier la clé publique affichée et l'ajouter dans `frontend/src-tauri/tauri.conf.json` :

```json
{
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaCnJ3UlRZWE1nZEdGMWNta2djMlZqY21WMElHdGxlUW9LVw=="
    }
  }
}
```

## 🧪 Tester le Système de Mise à Jour

### Test Local (Simulé)

1. **Build une version ancienne** :
```bash
cd frontend
npm run tauri:build
```

2. **Installer l'application** :
   - Aller dans `src-tauri/target/release/bundle/msi/`
   - Installer le MSI

3. **Bumper la version** :
```bash
./scripts/prepare-release.sh 1.0.4
```

4. **Créer une release GitHub** :
```bash
git add .
git commit -m "chore: bump version to 1.0.4"
git push origin main
git tag v1.0.4
git push origin v1.0.4
```

5. **Publier la release sur GitHub**

6. **Lancer l'ancienne version installée** :
   - La notification de mise à jour devrait apparaître
   - Cliquer sur "Mettre à jour"
   - Vérifier que le téléchargement et l'installation fonctionnent

### Vérification des Logs

Pour déboguer les problèmes de mise à jour :

**Sur Windows** :
```
%APPDATA%\com.fortiflow.app\logs\
```

Les logs Tauri contiennent les informations sur :
- La vérification des mises à jour
- Le téléchargement
- Les erreurs de signature

## 🚨 Dépannage

### "Aucune mise à jour disponible" alors qu'une nouvelle version existe

**Causes possibles** :
1. La release GitHub est encore en draft (non publiée)
2. Le fichier `latest.json` n'est pas présent dans les assets
3. L'URL dans `tauri.conf.json` est incorrecte

**Solution** :
- Vérifier que la release est publiée (pas draft)
- Vérifier l'URL : `https://github.com/albantsrr/ftn-grind/releases/latest/download/latest.json`

### "Erreur de signature invalide"

**Causes possibles** :
1. La clé publique dans `tauri.conf.json` ne correspond pas à la clé privée
2. Les secrets GitHub ne sont pas configurés correctement
3. Le fichier `.sig` est corrompu

**Solution** :
- Régénérer les clés et mettre à jour les secrets
- Rebuild la release

### "Erreur lors du téléchargement"

**Causes possibles** :
1. L'URL du MSI dans `latest.json` est incorrecte
2. Le fichier MSI n'est pas présent dans les assets de la release
3. Problème de connexion internet

**Solution** :
- Vérifier que tous les assets sont uploadés dans la release
- Vérifier les logs réseau dans l'application

## 📊 Statistiques de Mise à Jour

Pour suivre l'adoption des mises à jour :
- GitHub Releases → Voir les téléchargements par asset
- Le fichier MSI montre combien d'utilisateurs ont téléchargé
- Le fichier `latest.json` montre les vérifications de mise à jour

## 🔄 Workflow Recommandé

1. **Développement** : Travailler sur `main`
2. **Prêt pour release** : `./scripts/prepare-release.sh X.Y.Z`
3. **Push** : `git push && git push --tags`
4. **CI/CD** : Attendre que le workflow termine (5-10 min)
5. **Publish** : Publier la draft release sur GitHub
6. **Notification** : Les utilisateurs reçoivent la notification automatiquement

## 📝 Changelog Automatique

Le workflow génère automatiquement les release notes basées sur :
- Les commits depuis la dernière release
- Les PRs mergées
- Les issues fermées

Pour améliorer les release notes :
- Utiliser des commits conventionnels : `feat:`, `fix:`, `chore:`
- Écrire des messages de commit descriptifs

## 🎯 Best Practices

1. **Toujours tester** une release avant de la publier
2. **Vérifier les secrets GitHub** régulièrement
3. **Monitorer les logs** après une release
4. **Communiquer** les changements importants aux utilisateurs
5. **Créer des releases fréquentes** mais stables

## 🔗 Liens Utiles

- [Documentation Tauri Updater](https://v2.tauri.app/plugin/updater/)
- [GitHub Actions for Tauri](https://github.com/tauri-apps/tauri-action)
- [Code Signing Guide](https://v2.tauri.app/distribute/sign/)

---

**Note** : Le système de mise à jour fonctionne uniquement pour les **releases publiées** (pas les drafts). Assurez-vous de publier la release après que le workflow CI/CD ait terminé.
