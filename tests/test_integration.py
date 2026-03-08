"""
Async Integration tests for the MAOrchestrator and Gemini Live API (Issues #54, #55, #56).

These tests hit the real Google Gemini model to verify that the
Multi-Agent Orchestrator correctly dispatches tasks, parses JSON,
maintains speed, and identifies red flags.

Requires GOOGLE_API_KEY environment variable.
"""

import os
import time
import pytest
from typing import Dict, Any

from backend.agents.orchestrator import MAOrchestrator

# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio

# Global fixture to skip tests if Gemini API key is missing
@pytest.fixture(autouse=True)
def skip_if_no_api_key():
    if not os.getenv("GOOGLE_API_KEY"):
        pytest.skip("GOOGLE_API_KEY not set, skipping API integration test.")


class TestMAOrchestratorIntegration:
    """Live integration tests for the Multi-Agent framework."""

    @pytest.fixture
    def orchestrator(self):
        """Returns a configured MAOrchestrator instance."""
        return MAOrchestrator()

    async def test_full_pipeline_apple(self, orchestrator: MAOrchestrator):
        """
        Issue #54 (S3.3) - Verify full pipeline runs correctly for Apple.
        Should generate follow_up questions and a valid verdict.
        """
        # Run the full pipeline
        memo = await orchestrator.analyze_company("Apple Inc.")

        # Verify parsing was successful (no error flags)
        assert not memo.get("parse_error", False), "Failed to parse synthesis JSON"

        # Verify core structured data is present and valid
        assert memo.get("verdict") in ["BUY", "WATCH", "AVOID"]
        
        # Apple usually warrants a BUY or WATCH from an AI model
        assert memo.get("verdict") in ["BUY", "WATCH"]

        follow_ups = memo.get("follow_up_questions", [])
        assert isinstance(follow_ups, list)
        assert len(follow_ups) > 0, "Agents failed to generate follow-up strategy questions."

    async def test_parallel_execution_speed(self, orchestrator: MAOrchestrator):
        """
        Issue #55 (S3.4) - Verify agents are executing concurrently.
        Total execution for all 3 sub-agents + synthesis should be < 45 seconds.
        """
        start_time = time.time()
        
        # A simple query so the LLMs don't hit maximum token generation limits
        memo = await orchestrator.analyze_company("Tesla")
        
        end_time = time.time()
        duration = end_time - start_time

        # Assert time is under the 45 second architectural threshold
        assert duration < 45.0, f"Pipeline took too long ({duration:.1f}s), parallel execution may be broken."

        assert memo.get("verdict") in ["BUY", "WATCH", "AVOID"]

    async def test_red_flag_detection_high_risk_company(self, orchestrator: MAOrchestrator):
        """
        Issue #56 (S3.5) - Verify agents accurately identify massive red flags
        for known high-risk/failed companies and adjust the verdict appropriately.
        """
        # WeWork has universally known structural, governance, and financial red flags
        memo = await orchestrator.analyze_company("WeWork")

        red_flags = memo.get("red_flags", [])
        
        assert isinstance(red_flags, list)
        assert len(red_flags) > 0, "Failed to identify obvious red flags for WeWork."
        
        # An AI analyst should absolutely not recommend buying WeWork
        assert memo.get("verdict") in ["WATCH", "AVOID"]
