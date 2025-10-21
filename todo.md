# ✅ FortiFlow – ToDo List

## 🧠 Backend (FastAPI + SQLite)
- [X] Créer l’arborescence `backend/`
- [X] Initialiser `main.py` avec FastAPI + CORS + routes
- [X] Créer `requirements.txt` (`fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`)

### Database
- [X] Créer `database.py` (connexion SQLite, `SessionLocal`)
- [X] Créer `models.py` :
  - [X] Modèle `Routine` (id, nom, date)
  - [X] Modèle `RoutineStep` (id, routine_id, nom, code_map, durée, tips)
- [X] Exécuter `Base.metadata.create_all`

### API CRUD
- [X] Créer `routers/routines.py`
  - [X] `GET /routines`
  - [X] `GET /routines/{id}`
  - [X] `POST /routines`
  - [X] `PUT /routines/{id}`
  - [X] `DELETE /routines/{id}`
  - [X] Gestion erreurs (404, 422)

### Timer
- [X] Créer `routers/timer.py`
  - [X] Endpoint `POST /start-routine/{id}`
  - [X] Séquencer les étapes avec `asyncio.sleep()`
  - [X] Log du timer et retour JSON au frontend

### Tests & Doc
- [X] Doc interactive `/docs`
- [X] Tests unitaires (`pytest`)
- [X] Script de lancement `run_backend.sh`

---

## 💻 Frontend (React + TailwindCSS)
- [X] Initialiser projet React TypeScript (`vite`)
- [X] Installer et configurer TailwindCSS
- [X] Configurer `.env` (`VITE_API_URL`)

### Navigation
-[X] Ajouter `react-router-dom`
- [X] Pages :
  - [X] `/` : liste des routines
  - [X] `/create` : création
  - [X] `/play/:id` : exécution

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
