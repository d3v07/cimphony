import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

def test_health_check():
    """Test the health endpoint returns correctly."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "war room ready"
    assert "active_sessions" in data
