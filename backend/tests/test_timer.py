import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import models

# Create test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_timer.db"
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_routine_preview():
    """Test routine preview endpoint"""
    # Create a routine
    routine_data = {
        "nom": "Quick Warmup",
        "steps": [
            {
                "nom": "Aim Training",
                "code_map": "1111-2222-3333",
                "duree": 10,
                "tips": "Track smoothly"
            },
            {
                "nom": "Build Practice",
                "code_map": "4444-5555-6666",
                "duree": 15,
                "tips": "Speed builds"
            }
        ]
    }
    create_response = client.post("/api/routines/", json=routine_data)
    routine_id = create_response.json()["id"]

    # Preview the routine
    response = client.get(f"/api/timer/routine-preview/{routine_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["routine_name"] == "Quick Warmup"
    assert data["total_steps"] == 2
    assert data["total_duration_seconds"] == 25
    assert data["total_duration_formatted"] == "0m 25s"
    assert len(data["steps_preview"]) == 2


def test_routine_preview_not_found():
    """Test preview with non-existent routine returns 404"""
    response = client.get("/api/timer/routine-preview/999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_start_routine():
    """Test starting a routine execution"""
    # Create a routine with very short durations for testing
    routine_data = {
        "nom": "Test Routine",
        "steps": [
            {
                "nom": "Step 1",
                "code_map": "1111-2222-3333",
                "duree": 1,  # 1 second
                "tips": "Test tip 1"
            },
            {
                "nom": "Step 2",
                "code_map": "4444-5555-6666",
                "duree": 1,  # 1 second
                "tips": "Test tip 2"
            }
        ]
    }
    create_response = client.post("/api/routines/", json=routine_data)
    routine_id = create_response.json()["id"]

    # Start the routine
    response = client.post(f"/api/timer/start-routine/{routine_id}")
    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert data["routine_name"] == "Test Routine"
    assert data["status"] == "completed"
    assert data["total_steps"] == 2
    assert "started_at" in data
    assert "completed_at" in data
    assert "total_duration_seconds" in data
    assert len(data["execution_log"]) == 2

    # Check execution log
    log_step_1 = data["execution_log"][0]
    assert log_step_1["step_number"] == 1
    assert log_step_1["nom"] == "Step 1"
    assert log_step_1["code_map"] == "1111-2222-3333"
    assert log_step_1["duree"] == 1
    assert log_step_1["tips"] == "Test tip 1"
    assert "started_at" in log_step_1
    assert "completed_at" in log_step_1
    assert "actual_duration" in log_step_1


def test_start_routine_not_found():
    """Test starting a non-existent routine returns 404"""
    response = client.post("/api/timer/start-routine/999")
    assert response.status_code == 404


def test_start_routine_no_steps():
    """Test starting a routine with no steps returns 400"""
    # Create a routine without steps (we need to do this at DB level)
    from models import Routine as RoutineModel

    db = next(override_get_db())
    routine = RoutineModel(nom="Empty Routine")
    db.add(routine)
    db.commit()
    db.refresh(routine)
    routine_id = routine.id
    db.close()

    # Try to start it
    response = client.post(f"/api/timer/start-routine/{routine_id}")
    assert response.status_code == 400
    assert "no steps" in response.json()["detail"]
