# 🌀 FortiFlow  
### *Master your flow. Map by map.*

FortiFlow est un logiciel d’entraînement intelligent pour **Fortnite**, conçu pour les joueurs qui veulent s’améliorer avec méthode.  
Il permet de **créer, enregistrer et exécuter** des routines d’entraînement avec un **timer**, des **alertes sonores**, et des **instructions personnalisées** à chaque étape.

L’objectif : transformer les sessions d’échauffement en une expérience fluide, mesurable et motivante.

---a

## 🎯 Objectif produit

Créer un **logiciel desktop installable (Windows/macOS/Linux)**, moderne et évolutif, permettant aux joueurs Fortnite de :
- Structurer leurs sessions d’entraînement
- Exécuter leurs routines avec des bips et timers intégrés
- Enregistrer et modifier leurs routines facilement
- Travailler *offline*, sans dépendance internet

À terme, le projet doit pouvoir évoluer vers une **version cloud (SaaS)** avec synchronisation et partage communautaire.

---

## ✨ Fonctionnalités principales

### 🧩 Création de routines
- Ajout d’exercices avec :
  - Nom
  - Code de map (ex : `1234-5678-9999`)
  - Durée (en secondes ou minutes)
  - Tips / focus personnalisés

### ⏱️ Exécution guidée
- Timer intégré
- Bip sonore entre chaque étape
- Interface affichant le nom de la map, le code et les objectifs
- Contrôles : pause / reprise / étape suivante

### 💾 Stockage local
- Sauvegarde en base **SQLite**
- Lecture et écriture de routines via API FastAPI
- Mode **offline complet**

### 🎧 Interface moderne
- UI **React + TailwindCSS**
- Application packagée avec **Tauri** pour un rendu natif et léger
- Support du **Web Audio API** pour les sons

---

## 🧱 Stack technique

| Composant | Technologie | Rôle |
|------------|--------------|------|
| **Frontend** | React + TailwindCSS | Interface utilisateur |
| **Backend** | FastAPI (Python) | Logique métier, gestion routines |
| **Base locale** | SQLite | Stockage persistant local |
| **Audio** | Web Audio API | Gestion des alertes et sons |
| **Packaging** | Tauri | Génération d’un exécutable multiplateforme |
| **CI/CD** | GitHub Actions + Docker | Automatisation build & test |

---

## 📂 Structure du projet

```bash
ftn-grind/
├── backend/                   # API FastAPI
│   ├── main.py               # App initialization, CORS, routes
│   ├── models.py             # ORM & Pydantic models
│   ├── database.py           # SQLite connection
│   ├── routers/
│   │   ├── routines.py       # CRUD endpoints
│   │   └── timer.py          # Timer execution
│   ├── tests/                # pytest test suites
│   ├── requirements.txt
│   └── run_backend.sh        # Launch script
│
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── App.tsx           # Router config
│   │   ├── pages/            # Page components
│   │   ├── services/         # API client
│   │   └── types/            # TypeScript interfaces
│   ├── src-tauri/            # Tauri desktop app
│   │   ├── src/lib.rs        # Backend auto-start logic
│   │   └── tauri.conf.json   # App configuration
│   └── package.json
│
├── docs/                      # Documentation
│   ├── index.html            # Download page (GitHub Pages)
│   ├── setup/                # Installation guides
│   └── release/              # Release documentation
│
├── scripts/                   # Automation scripts
│   └── prepare-release.sh    # Release automation
│
├── .github/workflows/         # CI/CD
│   ├── release.yml           # Multi-platform builds
│   └── pages.yml             # GitHub Pages deploy
│
├── CLAUDE.md                  # Developer documentation
└── README.md                  # This file
```

---

## ⚙️ Installation (environnement de dev)

### 1️⃣ Cloner le projet
```bash
git clone https://github.com/<votre-utilisateur>/fortiflow.git
cd fortiflow
```

### 2️⃣ Lancer le backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sous Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 3000
```

Backend : `http://localhost:3000`

### 3️⃣ Lancer le frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Frontend : `http://localhost:5173`

### 4️⃣ Lancer la version desktop (Tauri)
```bash
npm run tauri dev
```

---

## 🧩 Exemple de routine

```json
{
  "routine_name": "Daily Warmup",
  "steps": [
    {
      "name": "Raider's Aim Map",
      "code": "1234-5678-9999",
      "duration_sec": 300,
      "tips": "Focus on headshot tracking"
    },
    {
      "name": "Flea Edit Course",
      "code": "9876-5432-1111",
      "duration_sec": 180,
      "tips": "Chain triple edits"
    }
  ]
}
```

---

## 🧭 Vision produit

FortiFlow ambitionne de devenir **le coach numérique des joueurs Fortnite**, en combinant :
- Structure : routines planifiées et ajustables
- Discipline : suivi régulier et objectifs mesurables
- Motivation : design immersif et feedbacks sonores

### 🌱 Roadmap produit
| Phase | Objectif | Stack |
|--------|-----------|--------|
| **MVP (local)** | App installable offline | React + FastAPI + Tauri + SQLite |
| **V1 Commerciale** | Version stable avec licence utilisateur | Tauri build + packaging multiplateforme |
| **V2 Cloud** | Comptes, synchronisation, partage de routines | FastAPI cloud + PostgreSQL |
| **V3 Mobile** | Companion app (Android/iOS) | React Native |

---

## 🔐 Licences et modèle économique

| Édition | Description |
|----------|-------------|
| **Free** | Version locale gratuite, offline |
| **Pro** | Historique, stats et synchronisation cloud |
| **Team** | Collaboration, routines partagées, export CSV |

FortiFlow adoptera un modèle **freemium**, avec distribution sous **licence propriétaire**.

---

## 👤 À propos

Développé par **Alban Teissier**  
💡 Data Engineer & AI Enthusiast  
🎯 Objectif : amener la rigueur de la data science dans le monde du training e-sport.

---

## 🧠 Besoins techniques à développer

1. **Backend FastAPI**
   - CRUD routines (GET/POST/PUT/DELETE)
   - Timer géré côté serveur
   - Persistance SQLite via SQLAlchemy
   - Endpoint `/start-routine` pour séquencer le timer

2. **Frontend React**
   - Formulaire de création / édition de routine
   - Interface d’exécution avec timer et bip sonore
   - Composants : `RoutineForm`, `RoutinePlayer`, `TimerDisplay`

3. **Tauri Packaging**
   - Communication locale entre React et FastAPI
   - Build Windows/macOS/Linux
   - Configuration dans `tauri.conf.json`

4. **Améliorations futures**
   - Stockage des stats par utilisateur
   - Export / import JSON
   - Authentification locale (pour version Pro)

---

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Architecture technique et guide de développement
- **[docs/setup/TAURI_SETUP.md](docs/setup/TAURI_SETUP.md)** - Guide d'installation complet
- **[docs/release/QUICK_RELEASE.md](docs/release/QUICK_RELEASE.md)** - Création rapide de releases
- **[docs/release/RELEASE.md](docs/release/RELEASE.md)** - Guide complet de release avec troubleshooting

---

## 💬 Contact

📧 **alban.teissier.dev@gmail.com**
🌐 [LinkedIn](https://www.linkedin.com/in/albanteissier/)
🕹️ *FortiFlow – Master your flow. Map by map.*
