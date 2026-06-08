from fastapi.testclient import TestClient

from app.api.v1 import health
from app.main import app


client = TestClient(app)


def test_health_check_returns_success_wrapper():
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {"status": "ok"},
    }


def test_database_health_check_returns_success_wrapper(monkeypatch):
    monkeypatch.setattr(health, "check_database_connection", lambda: True)

    response = client.get("/api/v1/health/db")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {"database": "ok"},
    }


def test_database_health_check_returns_error_wrapper(monkeypatch):
    monkeypatch.setattr(health, "check_database_connection", lambda: False)

    response = client.get("/api/v1/health/db")

    assert response.status_code == 503
    assert response.json() == {
        "success": False,
        "error": {
            "code": "DATABASE_UNAVAILABLE",
            "message": "Database connection failed.",
        },
    }
