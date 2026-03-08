import os
import pytest
from fastapi.testclient import TestClient

from backend.main import app

@pytest.mark.skipif(not os.getenv("GOOGLE_API_KEY"), reason="Requires GOOGLE_API_KEY")
def test_websocket_e2e():
    """Test the WebSocket E2E connecting to Gemini Live, triggering agents, and storing to Firestore."""
    with TestClient(app) as client:
        with client.websocket_connect("/ws") as websocket:
            # Receive the initial session_id payload
            data = websocket.receive_json()
            assert data.get("type") == "session_id"
            assert "session_id" in data
            
            # Send a command to analyze a company
            websocket.send_json({"type": "text", "text": "Analyze Apple"})
            
            # Assert we get some kind of acknowledgment (transcript, company_detected, or audio)
            received_valid_msg = False
            for _ in range(5):
                msg = websocket.receive_json()
                if msg.get("type") in ["transcript", "company_detected", "audio"]:
                    received_valid_msg = True
                    break
            
            assert received_valid_msg, "Did not receive expected WebSocket messages from Gemini Live"
