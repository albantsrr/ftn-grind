import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Support both SQLite (development) and PostgreSQL (production)
# Default to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fortiflow.db")

# SQLite-specific configuration
# connect_args={"check_same_thread": False} is needed only for SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine with appropriate configuration
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
