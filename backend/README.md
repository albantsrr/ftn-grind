# FortiFlow Backend

Backend API FastAPI pour FortiFlow - Application d'entraînement Fortnite.

## Environnements

### Développement Local
```bash
# Installer les dépendances
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --host 127.0.0.1 --port 3000
```

- URL: `http://localhost:3000`
- Base de données: SQLite (`fortiflow.db`)

### Production (VPS)
```bash
# Déployer vers le VPS
./deploy.sh
```

- URL: `http://72.61.166.22`
- Base de données: PostgreSQL (Docker)
- Documentation complète: [DEPLOYMENT.md](DEPLOYMENT.md)

## Tests

```bash
# Tous les tests
pytest

# Tests spécifiques
pytest tests/test_routines.py
pytest tests/test_timer.py

# Avec coverage
pytest --cov
```

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation
- `GET /api/routines/` - List all routines
- `POST /api/routines/` - Create routine
- `GET /api/routines/{id}` - Get routine by ID
- `PUT /api/routines/{id}` - Update routine
- `DELETE /api/routines/{id}` - Delete routine
- `POST /api/timer/start-routine/{id}` - Execute routine
- `GET /api/timer/routine-preview/{id}` - Preview routine

## Structure

```
backend/
├── main.py              # FastAPI app initialization
├── database.py          # Database connection (SQLite/PostgreSQL)
├── models.py            # SQLAlchemy ORM + Pydantic models
├── routers/
│   ├── routines.py      # CRUD endpoints for routines
│   └── timer.py         # Timer execution endpoints
├── tests/               # Test suite
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker image
├── docker-compose.yml   # Docker orchestration
├── deploy.sh            # Deployment script
└── DEPLOYMENT.md        # Production deployment guide
```

## Docker

Le backend peut être lancé avec Docker Compose (inclut PostgreSQL + Nginx):

```bash
docker compose up -d
```

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour plus de détails.
