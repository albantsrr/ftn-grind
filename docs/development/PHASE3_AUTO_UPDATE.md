# Phase 3 : Auto-Update Tauri (À implémenter)

## ✅ Complété

### 1. Backend version endpoint

**Fichier créé** : `backend/routers/version.py`

**Endpoints** :
- `GET /api/version/latest` - Infos sur la dernière version
- `GET /api/version/current` - Version actuelle depuis version.json

**Déjà intégré dans** : `backend/main.py`

---

## 🔲 À faire

### 2. Composant UpdateChecker Frontend

**Créer** : `frontend/src/components/UpdateChecker.tsx`

```typescript
import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkForUpdates();
    // Check every hour
    const interval = setInterval(checkForUpdates, 3600000);
    return () => clearInterval(interval);
  }, []);

  async function checkForUpdates() {
    try {
      const update = await check();
      if (update?.available) {
        setUpdateAvailable(true);
        setUpdateInfo(update);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  async function downloadAndInstall() {
    if (!updateInfo) return;

    setDownloading(true);
    try {
      await updateInfo.downloadAndInstall((progress) => {
        console.log(`Downloaded ${progress.downloaded} of ${progress.total}`);
      });

      // Relaunch app after update
      await relaunch();
    } catch (error) {
      console.error('Failed to update:', error);
      setDownloading(false);
    }
  }

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
      <h3 className="font-bold">Update Available!</h3>
      <p className="text-sm">Version {updateInfo?.version} is available</p>
      <button
        onClick={downloadAndInstall}
        disabled={downloading}
        className="mt-2 bg-white text-blue-600 px-4 py-2 rounded"
      >
        {downloading ? 'Downloading...' : 'Update Now'}
      </button>
    </div>
  );
}
```

**Intégrer dans** : `frontend/src/App.tsx`

```typescript
import { UpdateChecker } from './components/UpdateChecker';

function App() {
  return (
    <>
      <UpdateChecker />
      {/* Rest of your app */}
    </>
  );
}
```

---

### 3. Configuration Tauri Updater

**Modifier** : `frontend/src-tauri/tauri.conf.json`

Ajouter après `"bundle"` :

```json
{
  "bundle": {
    // ... existing config
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "http://72.61.166.22/api/version/latest"
      ],
      "dialog": false,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

---

### 4. Générer les clés de signature

```bash
# Installer tauri-cli
cd frontend
npm install --save-dev @tauri-apps/cli

# Générer une paire de clés
npx tauri signer generate -w ~/.tauri/myapp.key

# Output:
# Private: dW50cnVzdGVkIGNvbW1lbnQ6XXXXXXXXX
# Public: dW50cnVzdGVkIGNvbW1lbnQ6YYYYYYYYY
```

**Copier la clé publique** dans `tauri.conf.json` → `plugins.updater.pubkey`

**Sauvegarder la clé privée** en sécurité (pas dans Git !)

---

### 5. Signer les releases

**Ajouter dans** : `.github/workflows/release.yml`

```yaml
- name: Sign release artifacts
  env:
    TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
    TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
  run: |
    npm run tauri:build
```

**Configurer GitHub Secrets** :
- `TAURI_PRIVATE_KEY` : La clé privée générée
- `TAURI_KEY_PASSWORD` : (optionnel) mot de passe si défini

---

### 6. Mettre à jour l'endpoint version

**Modifier** : `backend/routers/version.py`

Ajouter la signature pour chaque release :

```python
return {
    "version": version,
    "notes": notes,
    "pub_date": f"{date}T00:00:00Z",
    "platforms": {
        "windows-x86_64": {
            "signature": read_signature_file(version),  # À implémenter
            "url": f"{base_url}/FortiFlow_{version}_x64_en-US.msi"
        }
    }
}
```

---

## 🧪 Test du workflow

### Scénario de test

1. **Release actuelle** : v1.0.1
2. **Créer nouvelle version** : v1.0.2

```bash
# 1. Préparer la release
./scripts/prepare-release.sh 1.0.2

# 2. Push (GitHub Actions build automatiquement)
git push && git push --tags

# 3. Attendre que la release soit créée sur GitHub

# 4. Ouvrir l'app v1.0.1
# → Notification d'update devrait apparaître

# 5. Cliquer "Update Now"
# → Téléchargement automatique
# → Installation automatique
# → Redémarrage → v1.0.2
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Toujours signer les releases** avec la clé privée
2. **Ne jamais commiter** la clé privée dans Git
3. **Utiliser HTTPS** pour l'endpoint (Phase 4)
4. **Vérifier les signatures** côté client (automatique avec Tauri)

### Stockage des clés

```bash
# Clé privée : ~/.tauri/fortiflow.key (local + GitHub Secrets)
# Clé publique : tauri.conf.json (commité dans Git)
```

---

## 🎯 Avantages de l'auto-update

✅ **Users toujours à jour** : Pas besoin de télécharger manuellement
✅ **Déploiement simplifié** : Push un tag → Release auto → Users mis à jour
✅ **Adoption rapide** : Nouvelles features disponibles immédiatement
✅ **Bug fixes rapides** : Correction déployée en quelques minutes

---

## 📊 Workflow complet avec auto-update

```
Code → Push → Tests → Deploy backend
                ↓
         Create release (tag)
                ↓
      GitHub Actions build
                ↓
         Release publiée
                ↓
      Backend /api/version/latest mis à jour
                ↓
    App Tauri check for updates (1x/hour)
                ↓
         Notification user
                ↓
      Download + Install automatique
                ↓
           Relaunch
                ↓
         App à jour ! 🎉
```

---

## 🐛 Troubleshooting

### Update check fails

**Cause** : Endpoint non accessible

**Fix** :
```bash
curl http://72.61.166.22/api/version/latest
# Doit retourner JSON avec version
```

### Signature verification fails

**Cause** : Clé publique incorrecte ou release non signée

**Fix** :
- Vérifier que `TAURI_PRIVATE_KEY` est dans GitHub Secrets
- Vérifier que la clé publique dans `tauri.conf.json` est correcte
- Re-build et re-sign la release

### Download fails

**Cause** : URL de download incorrecte

**Fix** : Vérifier que l'URL dans `/api/version/latest` pointe vers la bonne release GitHub

---

## 📚 Ressources

- [Tauri Updater Plugin Docs](https://v2.tauri.app/plugin/updater/)
- [Signing Updates](https://v2.tauri.app/plugin/updater/#signing-updates)
- [GitHub Actions Setup](https://v2.tauri.app/guides/distribution/updater/)

---

**Note** : L'implémentation complète de la Phase 3 prend environ 2-3 heures. C'est optionnel mais fortement recommandé pour une expérience utilisateur optimale.
