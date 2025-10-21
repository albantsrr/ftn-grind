import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import models

# Create test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
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


def test_root_endpoint():
    """Test root endpoint returns correct info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "FortiFlow API is running"
    assert data["docs"] == "/docs"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_get_all_routines_empty():
    """Test getting all routines when database is empty"""
    response = client.get("/api/routines/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_routine():
    """Test creating a new routine with steps"""
    routine_data = {
        "nom": "Daily Warmup",
        "steps": [
            {
                "nom": "Raider's Aim Map",
                "code_map": "1234-5678-9999",
                "duree": 300,
                "tips": "Focus on headshot tracking"
            },
            {
                "nom": "Flea Edit Course",
                "code_map": "9876-5432-1111",
                "duree": 180,
                "tips": "Chain triple edits"
            }
        ]
    }

    response = client.post("/api/routines/", json=routine_data)
    assert response.status_code == 201
    data = response.json()
    assert data["nom"] == "Daily Warmup"
    assert len(data["steps"]) == 2
    assert data["steps"][0]["nom"] == "Raider's Aim Map"
    assert data["steps"][0]["order"] == 0
    assert data["steps"][1]["order"] == 1


def test_get_routine_by_id():
    """Test getting a specific routine by ID"""
    # Create a routine first
    routine_data = {
        "nom": "Test Routine",
        "steps": [
            {
                "nom": "Step 1",
                "code_map": "1111-2222-3333",
                "duree": 60,
                "tips": "Test tips"
            }
        ]
    }
    create_response = client.post("/api/routines/", json=routine_data)
    routine_id = create_response.json()["id"]

    # Get the routine
    response = client.get(f"/api/routines/{routine_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["nom"] == "Test Routine"
    assert len(data["steps"]) == 1


def test_get_routine_not_found():
    """Test getting a non-existent routine returns 404"""
    response = client.get("/api/routines/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_update_routine():
    """Test updating a routine"""
    # Create a routine first
    routine_data = {
        "nom": "Original Name",
        "steps": [
            {
                "nom": "Step 1",
                "code_map": "1111-2222-3333",
                "duree": 60,
                "tips": None
            }
        ]
    }
    create_response = client.post("/api/routines/", json=routine_data)
    routine_id = create_response.json()["id"]

    # Update the routine
    update_data = {
        "nom": "Updated Name",
        "steps": [
            {
                "nom": "New Step",
                "code_map": "4444-5555-6666",
                "duree": 120,
                "tips": "New tips"
            }
        ]
    }
    response = client.put(f"/api/routines/{routine_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nom"] == "Updated Name"
    assert len(data["steps"]) == 1
    assert data["steps"][0]["nom"] == "New Step"


def test_update_routine_not_found():
    """Test updating a non-existent routine returns 404"""
    update_data = {"nom": "Updated Name"}
    response = client.put("/api/routines/999", json=update_data)
    assert response.status_code == 404


def test_delete_routine():
    """Test deleting a routine"""
    # Create a routine first
    routine_data = {
        "nom": "To Delete",
        "steps": [
            {
                "nom": "Step 1",
                "code_map": "1111-2222-3333",
                "duree": 60,
                "tips": None
            }
        ]
    }
    create_response = client.post("/api/routines/", json=routine_data)
    routine_id = create_response.json()["id"]

    # Delete the routine
    response = client.delete(f"/api/routines/{routine_id}")
    assert response.status_code == 204

    # Verify it's deleted
    get_response = client.get(f"/api/routines/{routine_id}")
    assert get_response.status_code == 404


def test_delete_routine_not_found():
    """Test deleting a non-existent routine returns 404"""
    response = client.delete("/api/routines/999")
    assert response.status_code == 404


def test_create_routine_validation_error():
    """Test creating a routine with invalid data returns 422"""
    invalid_data = {
        "nom": "Test",
        "steps": [
            {
                "nom": "Step 1",
                # Missing required fields
            }
        ]
    }
    response = client.post("/api/routines/", json=invalid_data)
    assert response.status_code == 422
