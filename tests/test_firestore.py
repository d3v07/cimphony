import pytest
import os


@pytest.mark.asyncio
async def test_firestore_write_and_read():
    """Integration test: write then read a deal memo from Firestore."""
    if not os.getenv("FIRESTORE_PROJECT_ID"):
        pytest.skip("FIRESTORE_PROJECT_ID not set")

    from backend.services.firestore_service import FirestoreService

    service = FirestoreService()
    test_memo = {
        "company": "TestCo",
        "verdict": "WATCH",
        "red_flags": ["Test flag 1"],
        "financials_summary": "Test financials",
        "competitive_summary": "Test competitive",
        "risk_summary": "Test risk",
    }
    session_id = "test-firestore-write-001"

    path = await service.write_deal_memo(session_id, test_memo)
    assert path == f"deals/{session_id}"

    retrieved = await service.get_deal_memo(session_id)
    assert retrieved["company"] == "TestCo"
    assert retrieved["verdict"] == "WATCH"


@pytest.mark.asyncio
async def test_firestore_append_red_flag():
    if not os.getenv("FIRESTORE_PROJECT_ID"):
        pytest.skip("FIRESTORE_PROJECT_ID not set")

    from backend.services.firestore_service import FirestoreService

    service = FirestoreService()
    session_id = "test-firestore-flag-001"

    await service.write_deal_memo(session_id, {
        "company": "FlagTestCo",
        "verdict": "AVOID",
        "red_flags": ["initial flag"],
    })

    await service.append_red_flag(session_id, "new critical flag")

    retrieved = await service.get_deal_memo(session_id)
    assert "new critical flag" in retrieved["red_flags"]
    assert "initial flag" in retrieved["red_flags"]
