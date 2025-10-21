from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import routines, timer
from database import engine, Base
import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FortiFlow API",
    description="API for managing Fortnite training routines",
    version="1.0.0"
)

# Configure CORS for local development and Tauri
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:1420",  # Tauri default
        "tauri://localhost",      # Tauri protocol
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routines.router, prefix="/api/routines", tags=["routines"])
app.include_router(timer.router, prefix="/api/timer", tags=["timer"])

@app.get("/")
async def root():
    return {
        "message": "FortiFlow API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
