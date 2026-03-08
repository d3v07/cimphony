"""
Integration tests for Firestore service (Issue #52 / S3.1).

Tests writing, reading, and appending red flags to a deal memo.
Skips gracefully if FIRESTORE_PROJECT_ID is not configured.
"""

import os
import pytest

from backend.services.firestore_service import FirestoreService

# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio

# Global fixture to skip tests if Firestore is not configured
@pytest.fixture(autouse=True)
def skip_if_no_firestore():
    if not os.getenv("FIRESTORE_PROJECT_ID"):
        pytest.skip("FIRESTORE_PROJECT_ID not set, skipping integration test.")


class TestFirestoreService:
    """Integration test suite against live Firestore."""

    @pytest.fixture
    def service(self):
        """Returns a configured FirestoreService instance."""
        return FirestoreService()

    async def test_firestore_write_read_roundtrip(self, service):
        """Verify we can save a deal memo and read it back perfectly."""
        test_id = "test-memo-roundtrip-001"
        test_data = {
            "verdict": "BUY",
            "confidence": "high",
            "red_flags": ["management turnover"],
        }

        # Save to database
        await service.save_deal_memo(test_id, test_data)

        # Retrieve and verify
        retrieved = await service.get_deal_memo(test_id)
        assert retrieved is not None
        assert retrieved["verdict"] == "BUY"
        assert retrieved["confidence"] == "high"
        assert "management turnover" in retrieved["red_flags"]

    async def test_firestore_append_red_flag(self, service):
        """Verify ArrayUnion correctly appends a new flag to an existing array."""
        test_id = "test-memo-flags-002"
        initial_data = {
            "verdict": "AVOID",
            "red_flags": ["initial flag"],
        }

        # Seed initial data
        await service.save_deal_memo(test_id, initial_data)

        # Append a new flag
        await service.append_red_flag(test_id, "new critical flag")

        # Retrieve and verify both flags exist
        retrieved = await service.get_deal_memo(test_id)
        assert retrieved is not None
        assert "initial flag" in retrieved["red_flags"]
        assert "new critical flag" in retrieved["red_flags"]

