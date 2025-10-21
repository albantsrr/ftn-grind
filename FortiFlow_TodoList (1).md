# ✅ FortiFlow – ToDo List

## 🧠 Backend (FastAPI + SQLite)
- [ ] Créer l’arborescence `backend/`
- [ ] Initialiser `main.py` avec FastAPI + CORS + routes
- [ ] Créer `requirements.txt` (`fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`)

### Database
- [ ] Créer `database.py` (connexion SQLite, `SessionLocal`)
- [ ] Créer `models.py` :
  - [ ] Modèle `Routine` (id, nom, date)
  - [ ] Modèle `RoutineStep` (id, routine_id, nom, code_map, durée, tips)
- [ ] Exécuter `Base.metadata.create_all`

### API CRUD
- [ ] Créer `routers/routines.py`
  - [ ] `GET /routines`
  - [ ] `GET /routines/{id}`
  - [ ] `POST /routines`
  - [ ] `PUT /routines/{id}`
  - [ ] `DELETE /routines/{id}`
  - [ ] Gestion erreurs (404, 422)

### Timer
- [ ] Créer `routers/timer.py`
  - [ ] Endpoint `POST /start-routine/{id}`
  - [ ] Séquencer les étapes avec `asyncio.sleep()`
  - [ ] Log du timer et retour JSON au frontend

### Tests & Doc
- [ ] Doc interactive `/docs`
- [ ] Tests unitaires (`pytest`)
- [ ] Script de lancement `run_backend.sh`

---

## 💻 Frontend (React + TailwindCSS)
- [ ] Initialiser projet React TypeScript (`vite`)
- [ ] Installer et configurer TailwindCSS
- [ ] Configurer `.env` (`VITE_API_URL`)

### Navigation
- [ ] Ajouter `react-router-dom`
- [ ] Pages :
  - [ ] `/` : liste des routines
  - [ ] `/create` : création
  - [ ] `/play/:id` : exécution

### RoutineForm.tsx
- [ ] Formulaire routine :
  - [ ] Nom
  - [ ] Liste d’exercices (nom, code, durée, tips)
- [ ] Boutons :
  - [ ] Ajouter un exercice
  - [ ] Enregistrer (POST)
  - [ ] Modifier (PUT)

### RoutineList.tsx
- [ ] Afficher toutes les routines
- [ ] Boutons :
  - [ ] ▶️ Jouer
  - [ ] ✏️ Modifier
  - [ ] 🗑️ Supprimer

### RoutinePlayer.tsx
- [ ] Charger routine via API
- [ ] Démarrer séquence timer
- [ ] Contrôles :
  - [ ] ⏯️ Pause / Reprise
  - [ ] ⏭️ Étape suivante
  - [ ] 🔁 Redémarrer
- [ ] Lecture bip sonore entre étapes (Web Audio API)
- [ ] Afficher infos : map, code, tips, temps restant

### TimerDisplay.tsx
- [ ] Chrono visuel (barre / digits)
- [ ] Étape actuelle / total
- [ ] Animation fluide (framer-motion)

### API Service
- [ ] Créer `api.ts`
  - [ ] `getRoutines()`
  - [ ] `getRoutineById()`
  - [ ] `createRoutine()`
  - [ ] `updateRoutine()`
  - [ ] `deleteRoutine()`
- [ ] Gestion erreurs + toasts (react-hot-toast)
- [ ] Support mode offline (localStorage ou IndexedDB)

---

## 🧱 Tauri (App Desktop)
- [ ] Créer dossier `src-tauri/`
- [ ] Configurer `tauri.conf.json`
  - [ ] Nom app
  - [ ] URL dev
  - [ ] API backend
- [ ] Vérifier communication React ↔ FastAPI (CORS)
- [ ] Lancer localement :
  ```bash
  npm run dev
  uvicorn main:app --reload
  npm run tauri dev
  ```
- [ ] Configurer build multiplateforme
- [ ] Workflow GitHub Actions :
  - [ ] Build Tauri (Windows/macOS/Linux)
  - [ ] Build React
  - [ ] Tests backend

---

## 🚀 Améliorations futures
### V1 (Commerciale)
- [ ] Gestion des licences locales
- [ ] Thème sombre/clair
- [ ] Écran “À propos” + version app

### V2 (Cloud / SaaS)
- [ ] Authentification (JWT)
- [ ] PostgreSQL cloud
- [ ] Synchronisation routines
- [ ] Stats d’entraînement

### V3 (Mobile)
- [ ] App React Native
- [ ] Notifications push
- [ ] Import/export routines

---

## 🧩 Bonus
- [ ] Export / Import JSON des routines
- [ ] Raccourcis clavier (start, next, pause)
- [ ] Design system Tailwind réutilisable
- [ ] Sandbox pour tester sons du timer
