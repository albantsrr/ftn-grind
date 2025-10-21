● Pour lancer le backend et le frontend, voici les commandes:

  Backend (FastAPI)

  Option 1: Avec le script automatique
  cd backend
  ./run_backend.sh

  Option 2: Manuellement
  cd backend
  python3 -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn main:app --reload

  Le backend sera accessible sur:
  - API: http://localhost:8000
  - Documentation interactive: http://localhost:8000/docs
  - Health check: http://localhost:8000/health

  Frontend (React + Vite)

  cd frontend
  npm run dev

  Le frontend sera accessible sur:
  - Application: http://localhost:5173