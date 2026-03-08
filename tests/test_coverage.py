"""
Unit setup for S4 Coverage.
Mocks the ADK runner so MAOrchestrator can be fully covered
without requiring a live GOOGLE_API_KEY.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from backend.agents.orchestrator import MAOrchestrator

pytestmark = pytest.mark.asyncio


class MockEvent:
    def __init__(self, author, is_final, content=None):
        self.author = author
        self.is_final_response = is_final
        self.content = content


class MockContent:
    def __init__(self, parts):
        self.parts = parts


class MockPart:
    def __init__(self, text):
        self.text = text


async def mock_run_async(*args, **kwargs):
    """Yields fake events to simulate the Parallel and Sequential agents."""
    yield MockEvent("FinancialAnalyst", False)
    yield MockEvent("FinancialAnalyst", True)
    yield MockEvent("CompetitiveAnalyst", True)
    yield MockEvent("SentimentAnalyst", True)

    yield MockEvent(
        "SynthesisAgent",
        True,
        MockContent(
            [
                MockPart(
                    '''```json
{
    "verdict": "WATCH",
    "confidence": "high",
    "red_flags": ["management turnover", "massive debt"],
    "follow_up_questions": ["What is the path to profitability?"],
    "one_liner": "Risky.",
    "sources": ["SEC 10-K"]
}
```'''
                )
            ]
        ),
    )


class TestOrchestratorCoverage:
    """Mock test suite to ensure MAOrchestrator hits 100% coverage."""

    @patch("backend.agents.orchestrator.Runner")
    async def test_orchestrator_full_run_mocked(self, mock_runner_class):
        # Setup mock runner instance
        mock_runner = MagicMock()
        mock_runner.run_async = mock_run_async
        mock_runner_class.return_value = mock_runner

        # Also mock Firestore to avoid needing FIRESTORE_PROJECT_ID
        with patch("backend.agents.orchestrator.MAOrchestrator._write_to_firestore", new_callable=AsyncMock) as mock_fs:
            orchestrator = MAOrchestrator()
            
            events_received = []
            def status_cb(event):
                events_received.append(event)

            memo = await orchestrator.analyze_company("MockCompany", "mock_session_1", status_cb)

            # Assert parsed memo
            assert memo["verdict"] == "WATCH"
            assert "massive debt" in memo["red_flags"]

            # Assert callbacks fired
            assert len(events_received) > 0
            assert any(e["type"] == "pipeline_complete" for e in events_received)
            assert any(e.get("agent") == "FinancialAnalyst" for e in events_received)

            # Assert firestore write was called
            mock_fs.assert_called_once()

    @patch("backend.agents.orchestrator.Runner")
    async def test_orchestrator_callback_exception(self, mock_runner_class):
        """Test that an exception in the callback doesn't crash the pipeline."""
        mock_runner = MagicMock()
        mock_runner.run_async = mock_run_async
        mock_runner_class.return_value = mock_runner
        
        with patch("backend.agents.orchestrator.MAOrchestrator._write_to_firestore", new_callable=AsyncMock):
            orchestrator = MAOrchestrator()
            
            def bad_cb(event):
                raise ValueError("Boom")
                
            memo = await orchestrator.analyze_company("MockCompany", "mock_session_2", bad_cb)
            assert memo["verdict"] == "WATCH"
