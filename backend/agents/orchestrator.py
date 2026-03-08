import asyncio
import json
import logging
import re
from typing import Any, Callable, Optional, Union

from google.adk.agents import ParallelAgent, SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from backend.agents.competitive_agent import create_competitive_agent
from backend.agents.financial_agent import create_financial_agent
from backend.agents.sentiment_agent import create_sentiment_agent
from backend.agents.synthesis_agent import create_synthesis_agent

logger = logging.getLogger(__name__)

_RESEARCH_AGENTS = frozenset(("FinancialAnalyst", "CompetitiveAnalyst", "SentimentAnalyst"))

APP_NAME = "cimphony"

_DEAL_MEMO_DEFAULTS: dict[str, Union[tuple[str, ...], str]] = {
    "verdict": "WATCH",
    "confidence": "medium",
    "red_flags": (),
    "follow_up_questions": (),
    "sources": (),
}


class MAOrchestrator:
    def __init__(self) -> None:
        self._session_service = InMemorySessionService()
        self._pipeline = self._build_agent_pipeline()
        self._runner = Runner(
            agent=self._pipeline,
            app_name=APP_NAME,
            session_service=self._session_service,
        )

    # ------------------------------------------------------------------
    # Pipeline construction
    # ------------------------------------------------------------------

    def _build_agent_pipeline(self) -> SequentialAgent:
        research_team = ParallelAgent(
            name="ResearchTeam",
            sub_agents=[
                create_financial_agent(),
                create_competitive_agent(),
                create_sentiment_agent(),
            ],
        )
        return SequentialAgent(
            name="MAPipeline",
            sub_agents=[research_team, create_synthesis_agent()],
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze_company(
        self,
        company_name: str,
        session_id: str,
        on_status_update: Optional[Callable[[dict[str, Any]], Any]] = None,
    ) -> dict[str, Any]:
        """
        Run the full MA pipeline for a given company.

        Fires on_status_update callbacks with event dicts throughout execution.
        Returns the parsed deal memo dict.
        Writes the deal memo to Firestore after pipeline completion.
        """

        async def _emit(event: dict[str, Any]) -> None:
            if on_status_update:
                try:
                    result = on_status_update(event)
                    if asyncio.iscoroutine(result) or asyncio.isfuture(result):
                        await result
                except Exception:
                    logger.exception("on_status_update callback raised an exception")

        # Create session
        await self._session_service.create_session(
            app_name=APP_NAME,
            user_id=session_id,
            session_id=session_id,
        )

        user_message = genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=f"Analyze {company_name}")],
        )

        synthesis_text: str = ""

        # Stream events from the runner
        async for event in self._runner.run_async(
            user_id=session_id,
            session_id=session_id,
            new_message=user_message,
        ):
            event_author: str = getattr(event, "author", "") or ""
            is_final: bool = getattr(event, "is_final_response", False)

            if event_author in _RESEARCH_AGENTS:
                await _emit(
                    {
                        "type": "agent_status",
                        "agent": event_author,
                        "is_final": is_final,
                    }
                )
                if is_final:
                    await _emit({"type": "agent_complete", "agent": event_author})

            elif event_author == "SynthesisAgent":
                if not is_final:
                    await _emit(
                        {
                            "type": "agent_status",
                            "agent": "SynthesisAgent",
                            "is_final": False,
                        }
                    )
                else:
                    content = getattr(event, "content", None)
                    if content:
                        for part in getattr(content, "parts", []):
                            text = getattr(part, "text", None)
                            if text:
                                synthesis_text += text

        # Parse the synthesis output into a structured deal memo
        deal_memo = self._parse_synthesis_output(synthesis_text, session_id)

        # Persist to Firestore
        await self._write_to_firestore(session_id, company_name, deal_memo)

        return deal_memo

    # ------------------------------------------------------------------
    # Output parsing
    # ------------------------------------------------------------------

    def _parse_synthesis_output(
        self, raw: str, session_id: str
    ) -> dict[str, Any]:
        """
        Attempt to extract a deal memo JSON from the synthesis agent output.

        Handles 4 cases:
          1. Clean ```json ... ``` fenced block
          2. Bare JSON object at the top level
          3. JSON embedded somewhere in garbage/prose via regex fallback
          4. Completely unparseable — returns sane defaults
        """
        # ---- Case 1: fenced ```json block ----
        fenced = re.search(r"```json\s*(\{.*?\})\s*```", raw, re.DOTALL)
        if fenced:
            parsed = self._try_parse_json(fenced.group(1))
            if parsed is not None:
                return self._apply_defaults(parsed, session_id)

        # ---- Case 2: entire string is valid JSON ----
        stripped = raw.strip()
        if stripped.startswith("{"):
            parsed = self._try_parse_json(stripped)
            if parsed is not None:
                return self._apply_defaults(parsed, session_id)

        # ---- Case 3: regex fallback — find outermost {...} blocks ----
        candidates = re.findall(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", raw, re.DOTALL)
        # Try from largest to smallest to prefer the full deal memo
        for candidate in sorted(candidates, key=len, reverse=True):
            parsed = self._try_parse_json(candidate)
            if parsed is not None:
                return self._apply_defaults(parsed, session_id)

        # ---- Case 4: completely unparseable — sane defaults ----
        logger.warning(
            "synthesis_output for session %s could not be parsed as JSON; "
            "returning defaults. Raw output (first 500 chars): %.500s",
            session_id,
            raw,
        )
        return self._apply_defaults(
            {"spoken_briefing_text": raw or "", "session_id": session_id},
            session_id,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _try_parse_json(text: str) -> Optional[dict[str, Any]]:
        try:
            result = json.loads(text)
            if isinstance(result, dict):
                return result
        except (json.JSONDecodeError, ValueError):
            pass
        return None

    @staticmethod
    def _apply_defaults(
        data: dict[str, Any], session_id: str
    ) -> dict[str, Any]:
        """Merge sane defaults into the parsed dict without overwriting existing keys."""
        for key, default_value in _DEAL_MEMO_DEFAULTS.items():
            # Convert tuples to fresh lists so each caller gets its own mutable copy
            data.setdefault(key, list(default_value) if isinstance(default_value, tuple) else default_value)
        data.setdefault("session_id", session_id)
        return data

    async def _write_to_firestore(
        self,
        session_id: str,
        company_name: str,
        deal_memo: dict[str, Any],
    ) -> None:
        """
        Persist the deal memo to Firestore under
        /sessions/{session_id}/deal_memos/{company_name}.

        Requires google-cloud-firestore to be installed and ADC configured.
        Fails silently with a warning so that the pipeline return value is
        never blocked by a Firestore outage.
        """
        try:
            from google.cloud import firestore  # lazy import — optional dep

            db = firestore.AsyncClient()
            doc_ref = (
                db.collection("sessions")
                .document(session_id)
                .collection("deal_memos")
                .document(company_name.replace(" ", "_").lower())
            )
            await doc_ref.set(deal_memo, merge=True)
            logger.info(
                "Deal memo for '%s' written to Firestore (session=%s)",
                company_name,
                session_id,
            )
        except ImportError:
            logger.warning(
                "google-cloud-firestore is not installed; skipping Firestore write."
            )
        except Exception:
            logger.exception(
                "Failed to write deal memo for '%s' to Firestore (session=%s)",
                company_name,
                session_id,
            )
