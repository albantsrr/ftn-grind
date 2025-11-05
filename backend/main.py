from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import routines, timer, auth, community, tags, ratings, subscriptions, statistics, leaderboard, version
from database import engine, Base
import models
import logging
from config import DEFAULT_TAGS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
logger.info("Creating database tables...")
Base.metadata.create_all(bind=engine)
logger.info("Database initialized successfully")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 50)
    logger.info("FortiFlow API v1.0.0 started successfully")
    logger.info("API running on http://127.0.0.1:3000")
    logger.info("API docs available at http://127.0.0.1:3000/docs")

    # Initialize default tags if they don't exist
    from database import SessionLocal
    db = SessionLocal()
    try:
        for tag_data in DEFAULT_TAGS:
            existing = db.query(models.Tag).filter(models.Tag.nom == tag_data["nom"]).first()
            if not existing:
                tag = models.Tag(**tag_data)
                db.add(tag)

        db.commit()
        logger.info("✓ Default tags initialized")
    except Exception as e:
        logger.error(f"Error initializing tags: {e}")
        db.rollback()
    finally:
        db.close()

    logger.info("=" * 50)
    yield
    # Shutdown (if needed)

app = FastAPI(
    title="FortiFlow API",
    description="API for managing Fortnite training routines",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for local development and Tauri
# Tauri uses custom protocols (tauri://, http://tauri.localhost, etc.)
# We need to allow all origins for localhost-only API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins since API is localhost-only
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(routines.router, prefix="/api/routines", tags=["routines"])
app.include_router(timer.router, prefix="/api/timer", tags=["timer"])
app.include_router(community.router, prefix="/api/community", tags=["community"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["ratings"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])
app.include_router(leaderboard.router)
app.include_router(version.router, prefix="/api/version", tags=["version"])

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": "FortiFlow API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return {"status": "healthy"}
