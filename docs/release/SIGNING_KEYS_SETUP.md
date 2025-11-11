# 🔐 Configuration des Clés de Signature Tauri

Guide rapide pour configurer les clés de signature nécessaires au système de mise à jour automatique.

## ⚡ Quick Start

### 1. Générer la Paire de Clés

```bash
cd /home/banal/ftn-grind/frontend

# Installer le CLI Tauri si pas déjà fait
npm install

# Générer les clés
npm run tauri signer generate -- -w ~/.tauri/fortiflow.key
```

**Important** : Notez bien le mot de passe si vous en choisissez un!

### 2. Récupérer les Valeurs

Le terminal affichera quelque chose comme :

```
Your keypair was generated successfully
Private: ~/.tauri/fortiflow.key (Keep this private!)
Public: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaCnJ3UlRZWE1nZEdGMWNta2djMlZqY21WMElHdGxlUW9LVw==

Environment variables used to sign:
  TAURI_SIGNING_PRIVATE_KEY  Path to private key file
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD  Password for private key (if set)
```

### 3. Configurer les Secrets GitHub

Aller sur : https://github.com/albantsrr/ftn-grind/settings/secrets/actions

**Créer `TAURI_SIGNING_PRIVATE_KEY` :**

```bash
# Sur Linux/macOS, récupérer le contenu :
cat ~/.tauri/fortiflow.key

# Copier TOUT le contenu et le coller dans le secret GitHub
```

**Créer `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` :**

```
# Si vous avez défini un mot de passe, l'ajouter ici
# Sinon, laisser vide ou ne pas créer ce secret
```

### 4. Ajouter la Clé Publique dans tauri.conf.json

Éditer `/home/banal/ftn-grind/frontend/src-tauri/tauri.conf.json` :

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/albantsrr/ftn-grind/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "COLLER_ICI_LA_CLE_PUBLIQUE_AFFICHEE_DANS_LE_TERMINAL"
    }
  }
}
```

**⚠️ IMPORTANT** : Remplacer `YOUR_PUBLIC_KEY_HERE` par la vraie clé publique générée!

### 5. Commit et Push

```bash
git add frontend/src-tauri/tauri.conf.json
git commit -m "chore: add updater public key"
git push origin main
```

## ✅ Vérification

### Test 1 : Vérifier que les Secrets sont Configurés

1. Aller sur : https://github.com/albantsrr/ftn-grind/settings/secrets/actions
2. Vous devriez voir :
   - ✅ `TAURI_SIGNING_PRIVATE_KEY` (dernière mise à jour : aujourd'hui)
   - ✅ `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (si utilisé)

### Test 2 : Build Local avec Signature

```bash
cd /home/banal/ftn-grind/frontend

# Définir les variables d'environnement
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/fortiflow.key)
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="votre_mot_de_passe"  # si utilisé

# Build
npm run tauri:build
```

Si le build réussit, les fichiers suivants seront créés :
- `src-tauri/target/release/bundle/msi/FortiFlow_*.msi`
- `src-tauri/target/release/bundle/msi/FortiFlow_*.msi.sig` ← **Fichier de signature**

### Test 3 : Release GitHub

Créer une release test :

```bash
./scripts/prepare-release.sh 1.0.3-test
git push && git push --tags
```

Vérifier que le workflow CI/CD :
1. ✅ Build sans erreur
2. ✅ Génère le fichier `.sig`
3. ✅ Génère le fichier `latest.json`
4. ✅ Upload tous les assets

## 🔄 Renouveler les Clés

Si vous avez perdu les clés ou voulez les renouveler :

### Étape 1 : Générer de Nouvelles Clés

```bash
# Backup de l'ancienne clé (si elle existe)
mv ~/.tauri/fortiflow.key ~/.tauri/fortiflow.key.old

# Générer une nouvelle paire
cd /home/banal/ftn-grind/frontend
npm run tauri signer generate -- -w ~/.tauri/fortiflow.key
```

### Étape 2 : Mettre à Jour les Secrets GitHub

Remplacer les valeurs des secrets avec les nouvelles clés.

### Étape 3 : Mettre à Jour tauri.conf.json

Remplacer `pubkey` avec la nouvelle clé publique.

### Étape 4 : Commit et Release

```bash
git add frontend/src-tauri/tauri.conf.json
git commit -m "chore: update signing keys"
./scripts/prepare-release.sh X.Y.Z
git push && git push --tags
```

**⚠️ IMPORTANT** : Toutes les versions précédentes ne pourront plus se mettre à jour automatiquement vers les nouvelles versions (clé publique différente).

## 🚨 Troubleshooting

### Erreur : "TAURI_SIGNING_PRIVATE_KEY is not set"

**Solution** :
- Vérifier que le secret GitHub existe
- Vérifier que le workflow CI/CD a accès aux secrets

### Erreur : "Invalid signature"

**Causes** :
1. La clé publique dans `tauri.conf.json` ne correspond pas à la clé privée
2. Le secret GitHub contient une clé différente

**Solution** :
- Régénérer les clés et tout reconfigurer

### Build Local Réussit mais CI/CD Échoue

**Solution** :
- Vérifier que les secrets GitHub sont correctement formatés (pas d'espaces supplémentaires)
- Vérifier que le secret contient TOUT le contenu du fichier (avec les lignes `-----BEGIN...` et `-----END...`)

## 📝 Exemple de Clé Privée Format

Le fichier `~/.tauri/fortiflow.key` ressemble à :

```
-----BEGIN PRIVATE KEY-----
untrusted comment: minisign encrypted secret key
RWS... (plusieurs lignes de base64)
...
-----END PRIVATE KEY-----
```

**Copier TOUT**, y compris les lignes BEGIN et END.

## 🎯 Checklist Finale

Avant de créer votre première release avec auto-update :

- [ ] Clés générées
- [ ] Secret `TAURI_SIGNING_PRIVATE_KEY` configuré sur GitHub
- [ ] Secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` configuré (si mot de passe)
- [ ] Clé publique ajoutée dans `tauri.conf.json`
- [ ] Build local teste avec succès
- [ ] Fichier `.sig` généré lors du build local
- [ ] Commit de `tauri.conf.json` poussé sur GitHub

Une fois tout validé, vous pouvez créer votre première release avec auto-update ! 🚀
