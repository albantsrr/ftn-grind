from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import routines, timer, auth
from database import engine, Base
import models
import logging

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
