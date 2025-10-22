# 🔧 Troubleshooting FortiFlow

## "Failed to fetch" en production Windows

### Symptôme
Lors de la création d'une routine dans la version installée (MSI), vous obtenez l'erreur "Failed to create routine: Failed to fetch".

### Cause
Le backend FastAPI ne démarre pas correctement dans la version bundlée.

---

## 📋 Diagnostics

### 1. Vérifier les logs de l'application

#### Sur Windows
Les logs sont enregistrés dans :
```
%APPDATA%\com.fortiflow.app\logs\
```

Ou vérifiez :
```
C:\Users\<VotreNom>\AppData\Roaming\com.fortiflow.app\logs\
```

**Recherchez le fichier le plus récent** et ouvrez-le pour voir les erreurs.

#### Logs à chercher
```
✅ Bon signe :
- "Backend path: ..."
- "Backend exists: true"
- "Found main.py at: ..."
- "Backend is now responding on port 3000"

❌ Mauvais signe :
- "Backend directory not found"
- "main.py not found"
- "Failed to start backend"
- "Backend failed to start - port 3000 not responding"
```

---

### 2. Vérifier que Python est installé

Ouvrez PowerShell et tapez :
```powershell
python --version
```

**Résultat attendu :** `Python 3.8.x` ou supérieur

**Si erreur :**
- Installez Python depuis [python.org](https://www.python.org/downloads/)
- ⚠️ Cochez "Add Python to PATH" lors de l'installation

---

### 3. Vérifier que le port 3000 est libre

Dans PowerShell :
```powershell
netstat -ano | findstr :3000
```

**Si vide :** Le port est libre ✅
**Si résultat :** Un autre programme utilise le port 3000 ❌

**Pour libérer le port :**
```powershell
# Trouver le PID (dernier nombre)
netstat -ano | findstr :3000

# Tuer le processus (remplacer <PID>)
taskkill /PID <PID> /F
```

---

### 4. Vérifier que le backend est bundlé

Naviguez vers le dossier d'installation (généralement) :
```
C:\Program Files\FortiFlow\
```

**Vérifiez qu'il y a un dossier `backend/` avec :**
- `main.py`
- `requirements.txt`
- `models.py`
- `database.py`
- `routers/` (dossier)

**Si absent :** Le bundle est incomplet, rebuilder l'application.

---

## 🛠️ Solutions

### Solution 1 : Rebuild propre

```bash
# Dans frontend/
npm run build
npm run tauri:build
```

Vérifiez que le build inclut bien le backend dans les logs.

### Solution 2 : Installer manuellement les dépendances Python

Si Python est installé mais les dépendances manquent :

```powershell
cd "C:\Program Files\FortiFlow\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Puis relancez FortiFlow.

### Solution 3 : Lancer le backend manuellement (debug)

Pour tester si le problème vient du bundle ou du code :

```powershell
cd "C:\Program Files\FortiFlow\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 3000
```

**Si ça fonctionne :** Le problème est dans le code Rust de démarrage auto.
**Si ça ne fonctionne pas :** Le backend lui-même a un problème.

### Solution 4 : Vérifier les permissions

Parfois Windows bloque l'exécution. Faites :
1. Clic droit sur `FortiFlow.exe` > Propriétés
2. Onglet "Sécurité" ou "Général"
3. Si un message de blocage apparaît, cliquez "Débloquer"

---

## 🐛 Erreurs courantes

### "python not found"
➡️ Python n'est pas installé ou pas dans PATH
**Solution :** Installer Python avec "Add to PATH"

### "Port 3000 already in use"
➡️ Un autre programme utilise le port
**Solution :** Tuer le processus ou changer le port dans le code

### "Backend directory not found"
➡️ Le backend n'est pas bundlé correctement
**Solution :** Vérifier `tauri.conf.json` : `"resources": ["../../backend"]`

### "Permission denied"
➡️ Windows bloque l'exécution
**Solution :** Exécuter en tant qu'administrateur ou débloquer le fichier

---

## 📊 Checklist de debug

- [ ] Python installé (`python --version`)
- [ ] Port 3000 libre (`netstat -ano | findstr :3000`)
- [ ] Dossier backend existe dans Program Files
- [ ] main.py présent dans backend/
- [ ] Logs consultés dans %APPDATA%
- [ ] Erreur identifiée dans les logs
- [ ] Backend testé manuellement

---

## 💬 Besoin d'aide ?

Si le problème persiste :
1. Récupérez les logs complets
2. Notez la version de Python
3. Notez l'erreur exacte
4. Ouvrez une issue sur GitHub avec ces informations
