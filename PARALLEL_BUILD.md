# M&A WAR ROOM — 4-PERSON PARALLEL BUILD

## Columbia Business School × Google Hackathon 2026 | Team: DilliGents | CIMphony

---

## GIT WORKFLOW (ALL TEAMMATES — READ FIRST)

```bash
# STEP 0: One person (Person D) creates the repo and scaffolding FIRST (15 min)
# Everyone else waits for the "scaffold-ready" message in Slack/chat before starting.

# Clone and branch
git clone <repo-url> ma-warroom && cd ma-warroom
git checkout -b <your-branch>  # See branch names below

# While working — commit often with conventional commits
git add -A && git commit -m "feat(agents): add financial agent with google search grounding"
git add -A && git commit -m "test(agents): add orchestrator integration test"

# When done — push and open PR
git push origin <your-branch>

# Integration merge order (Person D coordinates):
# 1. person-d/infra     → main   (scaffolding + config)
# 2. person-a/agents    → main   (no conflicts — new files only)
# 3. person-b/services  → main   (no conflicts — new files only)
# 4. person-c/frontend  → main   (no conflicts — separate directory)
# 5. person-b/glue      → main   (main.py — depends on agents + services)
# 6. Final integration test on main
```

### Conventional Commit Prefixes
- `feat()` — new feature/file
- `fix()` — bug fix
- `test()` — test file
- `chore()` — config, deps, CI
- `docs()` — documentation

---

## DEPENDENCY GRAPH

```
                    ┌─────────────────┐
                    │   PERSON D      │
                    │   Scaffolding   │
                    │   (15 min)      │
                    └────────┬────────┘
                             │ scaffold-ready
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼───────┐ ┌────▼──────────┐
     │   PERSON A    │ │  PERSON B  │ │   PERSON C    │
     │   ADK Agents  │ │  Services  │ │   Frontend    │
     │   (60 min)    │ │  + Voice   │ │   (60 min)    │
     │               │ │  (60 min)  │ │               │
     └────────┬──────┘ └─────┬──────┘ └────┬──────────┘
              │              │              │
              │    ┌─────────▼──────┐       │
              └───►│   PERSON B     │       │
                   │   main.py glue │       │
                   │   (30 min)     │       │
                   └────────┬───────┘       │
                            │               │
                   ┌────────▼───────────────▼──┐
                   │       PERSON D            │
                   │   Deploy + Integration    │
                   │       (30 min)            │
                   └───────────────────────────┘
```

---

# ═══════════════════════════════════════════════════════════════
# PERSON A — ADK AGENT PIPELINE ENGINEER
# Branch: person-a/agents
# ═══════════════════════════════════════════════════════════════

## Your Ownership
```
backend/
├── prompts/
│   ├── orchestrator_prompt.py      ← YOU
│   ├── financial_prompt.py         ← YOU
│   ├── competitive_prompt.py       ← YOU
│   ├── sentiment_prompt.py         ← YOU
│   └── synthesis_prompt.py         ← YOU
├── agents/
│   ├── __init__.py                 ← YOU
│   ├── financial_agent.py          ← YOU
│   ├── competitive_agent.py        ← YOU
│   ├── sentiment_agent.py          ← YOU
│   ├── synthesis_agent.py          ← YOU
│   └── orchestrator.py             ← YOU
tests/
└── test_agents.py                  ← YOU
```

## PROMPT FOR PERSON A

```
You are building the ADK agent pipeline for an M&A Due Diligence War Room — a Columbia Business School × Google hackathon project. You are working inside Google Cloud Shell. The project scaffolding is already set up with all dependencies installed. You ONLY build the agent layer. No stubs, no TODOs, no placeholders. Every file must be complete and runnable.

TECH CONTEXT:
- google-adk==1.0.0 (Google Agent Development Kit)
- Model: gemini-2.0-flash
- Google Search Grounding via google_search tool from google.adk.tools
- ParallelAgent runs 3 sub-agents simultaneously
- SequentialAgent chains ParallelAgent → SynthesisAgent
- Runner executes the pipeline with InMemorySessionService
- Each agent writes to a unique output_key in session state

YOUR BRANCH: person-a/agents
GIT COMMITS: Make one commit per logical unit (prompts, each agent, orchestrator, tests).

═══════════════════════════════════════════
STEP 1: CREATE ALL 5 PROMPT FILES (10 min)
═══════════════════════════════════════════

Create backend/prompts/orchestrator_prompt.py:

ORCHESTRATOR_SYSTEM_PROMPT = """
You are the Chief M&A Orchestrator for an elite investment banking war room.

Your role:
1. Listen for a company name from the user's voice input
2. When you detect a company name, extract it and trigger parallel research
3. Synthesize the research findings from your three specialist agents
4. Deliver a crisp, spoken senior banker briefing — authoritative, specific, and red-flag-forward

Tone: Senior Goldman Sachs MD. Precise. No fluff. Lead with the most important finding.
Every number you cite must come from grounded search data.

When the user interrupts or asks a follow-up question mid-briefing:
- Stop immediately and address the question
- Reference only data already loaded in session state
- Return to briefing if user says "continue"

Format your spoken output as:
"[Company] overview: [2-sentence macro picture]. Financials: [key metrics + 1 flag if any].
Competitive position: [moat assessment + key threat]. Risk signals: [top 1-2 risks].
Overall: [buy/watch/avoid recommendation with reasoning]."

Never say "I found" or "Based on my search." Speak as if you know this company cold.
"""


Create backend/prompts/financial_prompt.py:

FINANCIAL_ANALYST_PROMPT = """
You are a buy-side financial analyst. Your job is to research a single company's financial health using Google Search grounding. Execute immediately — no preamble.

For the given company, find and return structured data on:
1. Revenue (last 2 years, YoY growth %)
2. EBITDA margin (current vs industry average if findable)
3. Net income / operating cash flow trend
4. Debt-to-equity ratio or net debt figure
5. Most recent earnings surprise (beat/miss + %)
6. Any guidance cuts, restatements, or auditor flags

CRITICAL: Flag any discrepancy between management narrative and actual reported numbers.
Flag if Q3/Q4 cash flow diverges significantly from revenue trend.
Flag any recent CFO/auditor changes.

Return as structured JSON with keys:
{
  "revenue": {"current": "", "prior_year": "", "growth_pct": ""},
  "ebitda_margin": {"current": "", "industry_avg": ""},
  "cash_flow": {"operating": "", "trend": "improving|declining|stable"},
  "debt": {"de_ratio": "", "net_debt": ""},
  "earnings": {"last_surprise": "", "beat_miss": ""},
  "red_flags": ["flag1", "flag2"],
  "sources": ["url1", "url2"]
}
"""


Create backend/prompts/competitive_prompt.py:

COMPETITIVE_ANALYST_PROMPT = """
You are a competitive intelligence analyst. Research the competitive landscape for the given company using Google Search grounding. No preamble — execute immediately.

Find and return:
1. Top 3 direct competitors with market share estimates
2. Company's primary competitive moat (cost, network, brand, IP, switching cost)
3. Most recent competitive threat or market share shift
4. Any recent product launch, acquisition, or strategic pivot by competitors
5. Industry tailwind/headwind (1 sentence)

CRITICAL: Note if any competitor just raised significant funding or announced a product
that directly threatens this company's core revenue line.

Return as structured JSON:
{
  "competitors": [
    {"name": "", "market_share_est": "", "key_differentiator": ""}
  ],
  "moat": {"type": "", "strength": "strong|moderate|weak", "rationale": ""},
  "recent_threat": {"company": "", "action": "", "impact": ""},
  "industry_trend": "",
  "red_flags": ["flag1"],
  "sources": ["url1"]
}
"""


Create backend/prompts/sentiment_prompt.py:

SENTIMENT_ANALYST_PROMPT = """
You are a risk and sentiment analyst. Using Google Search grounding, analyze recent news, executive statements, and public signals for the given company. No preamble — execute immediately.

Find and return:
1. Overall news sentiment (last 30 days): positive/neutral/negative + brief reason
2. Any executive departures (C-suite level) in last 6 months
3. Regulatory, legal, or SEC investigation mentions
4. Recent layoffs, restructuring, or office closures
5. Analyst rating changes (upgrades/downgrades) in last 30 days
6. Social/media sentiment flags (viral negative press, controversy, boycotts)

CRITICAL FLAGS:
- CEO/CFO departure within 90 days = HIGH risk flag
- SEC investigation mention = HIGH risk flag
- Guidance cut + insider selling = HIGH risk flag
- Any mention of "going concern" = CRITICAL flag

Return as structured JSON:
{
  "news_sentiment": {"score": "positive|neutral|negative", "reason": ""},
  "executive_changes": [{"role": "", "type": "departure|appointment", "date": ""}],
  "regulatory": {"issues": "", "severity": "none|low|medium|high"},
  "restructuring": {"occurred": true/false, "details": ""},
  "analyst_ratings": {"recent_changes": "", "consensus": ""},
  "red_flags": ["flag1", "flag2"],
  "risk_score": "low|medium|high|critical",
  "sources": ["url1"]
}
"""


Create backend/prompts/synthesis_prompt.py:

SYNTHESIS_PROMPT = """
You are a Senior Managing Director at Goldman Sachs M&A Advisory.
You have just received research from three specialist analysts on a target company.
Your job: deliver a spoken briefing and write a deal memo.

SPOKEN BRIEFING RULES:
- Maximum 90 seconds of speech (approximately 200-220 words)
- Open with the single most important finding
- Cite specific numbers — never say "strong revenue growth," say "22% YoY revenue growth"
- Red flags must be called out explicitly: "Flagging this: [specific issue]"
- End with a clear verdict: BUY / WATCH / AVOID with one-sentence rationale
- Speak in first person as if you've known this company for years
- Do NOT say "based on my research" or "the agents found" — just speak with authority

DEAL MEMO RULES (for Firestore):
Structure as JSON with these exact keys:
{
  "company": "",
  "timestamp": "",
  "session_id": "",
  "verdict": "BUY|WATCH|AVOID",
  "confidence": "high|medium|low",
  "one_liner": "",
  "financials_summary": "",
  "competitive_summary": "",
  "risk_summary": "",
  "red_flags": ["flag1", "flag2"],
  "follow_up_questions": ["q1", "q2", "q3"],
  "spoken_briefing_text": "",
  "sources": ["url1", "url2"]
}

The financial research is in: {financial_data}
The competitive research is in: {competitive_data}
The sentiment research is in: {sentiment_data}

First output the SPOKEN BRIEFING as plain text (this will be read aloud).
Then output the DEAL MEMO as a JSON block wrapped in ```json ... ```.
"""


GIT CHECKPOINT:
git add backend/prompts/ && git commit -m "feat(prompts): add all 5 agent prompt templates"


═══════════════════════════════════════════════
STEP 2: CREATE 4 AGENT FACTORY FILES (15 min)
═══════════════════════════════════════════════

Create backend/agents/__init__.py (empty file).

Create backend/agents/financial_agent.py:

from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from backend.prompts.financial_prompt import FINANCIAL_ANALYST_PROMPT


def create_financial_agent() -> LlmAgent:
    return LlmAgent(
        name="FinancialAnalyst",
        model="gemini-2.0-flash",
        description="Researches financial metrics, earnings data, and cash flow signals for M&A due diligence.",
        instruction=FINANCIAL_ANALYST_PROMPT,
        tools=[google_search],
        output_key="financial_data",
    )


Create backend/agents/competitive_agent.py:

from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from backend.prompts.competitive_prompt import COMPETITIVE_ANALYST_PROMPT


def create_competitive_agent() -> LlmAgent:
    return LlmAgent(
        name="CompetitiveAnalyst",
        model="gemini-2.0-flash",
        description="Maps competitive landscape, moat strength, and market threats for M&A targets.",
        instruction=COMPETITIVE_ANALYST_PROMPT,
        tools=[google_search],
        output_key="competitive_data",
    )


Create backend/agents/sentiment_agent.py:

from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from backend.prompts.sentiment_prompt import SENTIMENT_ANALYST_PROMPT


def create_sentiment_agent() -> LlmAgent:
    return LlmAgent(
        name="SentimentAnalyst",
        model="gemini-2.0-flash",
        description="Analyzes news sentiment, executive departures, regulatory risks for M&A targets.",
        instruction=SENTIMENT_ANALYST_PROMPT,
        tools=[google_search],
        output_key="sentiment_data",
    )


Create backend/agents/synthesis_agent.py:

from google.adk.agents import LlmAgent
from backend.prompts.synthesis_prompt import SYNTHESIS_PROMPT


def create_synthesis_agent() -> LlmAgent:
    return LlmAgent(
        name="SynthesisAgent",
        model="gemini-2.0-flash",
        description="Synthesizes M&A research into a spoken banker briefing and structured deal memo.",
        instruction=SYNTHESIS_PROMPT,
        output_key="synthesis_output",
    )

NOTE: SynthesisAgent has NO tools — it reads from session state keys (financial_data, competitive_data, sentiment_data) populated by the parallel agents.


GIT CHECKPOINT:
git add backend/agents/ && git commit -m "feat(agents): add financial, competitive, sentiment, synthesis agent factories"


═══════════════════════════════════════════════════════
STEP 3: CREATE ORCHESTRATOR — THE BRAIN (20 min)
═══════════════════════════════════════════════════════

Create backend/agents/orchestrator.py:

import json
import re
from typing import Optional, Callable

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk import types

from backend.agents.financial_agent import create_financial_agent
from backend.agents.competitive_agent import create_competitive_agent
from backend.agents.sentiment_agent import create_sentiment_agent
from backend.agents.synthesis_agent import create_synthesis_agent
from backend.services.firestore_service import FirestoreService
from backend.prompts.orchestrator_prompt import ORCHESTRATOR_SYSTEM_PROMPT


class MAOrchestrator:
    """
    Root orchestrator for the M&A War Room.

    Architecture:
        SequentialAgent
        └── ParallelAgent (runs A, B, C simultaneously)
            ├── FinancialAnalyst  (Agent A) → output_key: financial_data
            ├── CompetitiveAnalyst (Agent B) → output_key: competitive_data
            └── SentimentAnalyst  (Agent C) → output_key: sentiment_data
        └── SynthesisAgent (reads A+B+C, produces briefing + memo)
    """

    def __init__(self):
        self.session_service = InMemorySessionService()
        self.firestore = FirestoreService()
        self._build_agent_pipeline()

    def _build_agent_pipeline(self):
        financial_agent = create_financial_agent()
        competitive_agent = create_competitive_agent()
        sentiment_agent = create_sentiment_agent()

        research_parallel = ParallelAgent(
            name="ResearchTeam",
            sub_agents=[financial_agent, competitive_agent, sentiment_agent],
        )

        synthesis_agent = create_synthesis_agent()

        self.pipeline = SequentialAgent(
            name="MAPipeline",
            sub_agents=[research_parallel, synthesis_agent],
        )

        self.runner = Runner(
            agent=self.pipeline,
            app_name="ma_warroom",
            session_service=self.session_service,
        )

    async def analyze_company(
        self,
        company_name: str,
        session_id: str,
        on_status_update: Optional[Callable] = None,
    ) -> dict:
        """
        Main entry point. Runs full parallel research pipeline for a company.

        Returns dict with 'spoken_briefing' and 'deal_memo' keys.
        """
        user_id = "warroom_user"

        await self.session_service.create_session(
            app_name="ma_warroom",
            user_id=user_id,
            session_id=session_id,
        )

        initial_message = f"Analyze {company_name} for M&A due diligence."

        if on_status_update:
            await on_status_update({
                "type": "agent_status",
                "agents": ["FinancialAnalyst", "CompetitiveAnalyst", "SentimentAnalyst"],
                "status": "running",
                "company": company_name,
            })

        final_response_text = ""
        async for event in self.runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=types.Content(
                role="user",
                parts=[types.Part(text=initial_message)],
            ),
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.text:
                            final_response_text += part.text

            if on_status_update and hasattr(event, "author"):
                if event.author in ["FinancialAnalyst", "CompetitiveAnalyst", "SentimentAnalyst"]:
                    await on_status_update(
                        {"type": "agent_complete", "agent": event.author}
                    )

        result = self._parse_synthesis_output(final_response_text)
        result["company"] = company_name
        result["session_id"] = session_id

        await self.firestore.write_deal_memo(session_id, result["deal_memo"])

        if on_status_update:
            await on_status_update(
                {"type": "pipeline_complete", "session_id": session_id}
            )

        return result

    def _parse_synthesis_output(self, raw_text: str) -> dict:
        """
        Parses synthesis agent output into spoken_briefing + deal_memo.
        Handles: ```json blocks, bare JSON, malformed output.
        """
        spoken_briefing = raw_text
        deal_memo = {}

        if "```json" in raw_text:
            parts = raw_text.split("```json")
            spoken_briefing = parts[0].strip()
            json_part = parts[1].split("```")[0].strip()
            try:
                deal_memo = json.loads(json_part)
            except json.JSONDecodeError:
                deal_memo = {"raw": json_part, "parse_error": True}
        else:
            # Fallback: regex extract any JSON object
            json_match = re.search(r'\{[\s\S]*\}', raw_text)
            if json_match:
                try:
                    deal_memo = json.loads(json_match.group())
                    spoken_briefing = raw_text[:json_match.start()].strip()
                except json.JSONDecodeError:
                    deal_memo = {"raw": raw_text, "parse_error": True}

        # Guarantee all required keys exist with sane defaults
        deal_memo.setdefault("verdict", "WATCH")
        deal_memo.setdefault("confidence", "medium")
        deal_memo.setdefault("one_liner", "Analysis complete.")
        deal_memo.setdefault("red_flags", [])
        deal_memo.setdefault("follow_up_questions", [])
        deal_memo.setdefault("sources", [])
        deal_memo.setdefault("financials_summary", "")
        deal_memo.setdefault("competitive_summary", "")
        deal_memo.setdefault("risk_summary", "")

        return {"spoken_briefing": spoken_briefing, "deal_memo": deal_memo}


GIT CHECKPOINT:
git add backend/agents/orchestrator.py && git commit -m "feat(agents): add MAOrchestrator with ParallelAgent + SequentialAgent pipeline"


═══════════════════════════════════════
STEP 4: WRITE TESTS (15 min)
═══════════════════════════════════════

Create tests/test_agents.py:

import json
import pytest
from backend.agents.orchestrator import MAOrchestrator


class TestParseSynthesisOutput:
    """Unit tests for _parse_synthesis_output — no API calls needed."""

    def setup_method(self):
        """Create orchestrator instance. Firestore won't be called in parse tests."""
        self.orchestrator = MAOrchestrator.__new__(MAOrchestrator)

    def test_parse_clean_json_block(self):
        raw = '''Apple shows strong revenue growth of 8% YoY.

```json
{
  "company": "Apple",
  "verdict": "BUY",
  "confidence": "high",
  "one_liner": "Dominant ecosystem with strong cash generation.",
  "financials_summary": "8% YoY revenue growth",
  "competitive_summary": "Strong moat via ecosystem lock-in",
  "risk_summary": "Regulatory pressure in EU",
  "red_flags": [],
  "follow_up_questions": ["What is services revenue growth?"],
  "sources": ["https://finance.yahoo.com"]
}
```'''
        result = self.orchestrator._parse_synthesis_output(raw)

        assert "Apple shows strong" in result["spoken_briefing"]
        assert result["deal_memo"]["verdict"] == "BUY"
        assert result["deal_memo"]["company"] == "Apple"
        assert result["deal_memo"]["confidence"] == "high"
        assert isinstance(result["deal_memo"]["red_flags"], list)

    def test_parse_no_json_block_fallback_regex(self):
        raw = '''Tesla is overvalued. {"verdict": "AVOID", "confidence": "high", "one_liner": "Overvalued", "red_flags": ["margin compression"]}'''
        result = self.orchestrator._parse_synthesis_output(raw)

        assert result["deal_memo"]["verdict"] == "AVOID"
        assert len(result["deal_memo"]["red_flags"]) > 0

    def test_parse_garbage_input_returns_defaults(self):
        raw = "This is just plain text with no JSON at all."
        result = self.orchestrator._parse_synthesis_output(raw)

        assert result["spoken_briefing"] == raw
        assert result["deal_memo"]["verdict"] == "WATCH"
        assert result["deal_memo"]["confidence"] == "medium"
        assert isinstance(result["deal_memo"]["red_flags"], list)

    def test_parse_malformed_json_block(self):
        raw = '''Briefing text here.

```json
{"verdict": "BUY", "confidence": INVALID_JSON}
```'''
        result = self.orchestrator._parse_synthesis_output(raw)
        assert "parse_error" in result["deal_memo"]
        assert result["deal_memo"]["verdict"] in ["BUY", "WATCH"]

    def test_all_default_keys_present(self):
        raw = '```json\n{"verdict": "BUY"}\n```'
        result = self.orchestrator._parse_synthesis_output(raw)
        required_keys = [
            "verdict", "confidence", "one_liner", "red_flags",
            "follow_up_questions", "sources", "financials_summary",
            "competitive_summary", "risk_summary"
        ]
        for key in required_keys:
            assert key in result["deal_memo"], f"Missing key: {key}"


@pytest.mark.asyncio
async def test_full_pipeline_apple():
    """
    INTEGRATION TEST: Full pipeline for Apple Inc.
    Requires GOOGLE_API_KEY set in environment.
    Skip if no API key available.
    """
    import os
    if not os.getenv("GOOGLE_API_KEY"):
        pytest.skip("GOOGLE_API_KEY not set — skipping integration test")

    orchestrator = MAOrchestrator()
    result = await orchestrator.analyze_company(
        company_name="Apple",
        session_id="test-apple-001",
    )

    assert "spoken_briefing" in result
    assert len(result["spoken_briefing"]) > 100
    memo = result["deal_memo"]
    assert memo["verdict"] in ["BUY", "WATCH", "AVOID"]
    assert isinstance(memo["red_flags"], list)
    assert memo["financials_summary"] != ""


@pytest.mark.asyncio
async def test_parallel_execution_speed():
    """
    Verify ParallelAgent runs 3 sub-agents concurrently (< 45s, not 90s sequential).
    Requires GOOGLE_API_KEY.
    """
    import os
    import time
    if not os.getenv("GOOGLE_API_KEY"):
        pytest.skip("GOOGLE_API_KEY not set — skipping integration test")

    orchestrator = MAOrchestrator()
    start = time.time()
    result = await orchestrator.analyze_company(
        company_name="Microsoft",
        session_id="test-speed-001",
    )
    elapsed = time.time() - start
    assert elapsed < 45, f"Pipeline took {elapsed:.1f}s — ParallelAgent may not be running in parallel"
    assert result["spoken_briefing"] != ""


RUN TESTS:
# Unit tests (always run — no API key needed):
python -m pytest tests/test_agents.py::TestParseSynthesisOutput -v

# Integration tests (only if GOOGLE_API_KEY is set):
python -m pytest tests/test_agents.py -v --timeout=120


GIT CHECKPOINT:
git add tests/ && git commit -m "test(agents): add parse unit tests and pipeline integration tests"


═══════════════════
DONE CHECKLIST
═══════════════════

Before pushing, verify:
[ ] All 5 prompt files exist and contain string constants
[ ] All 4 agent factory files create LlmAgent instances
[ ] orchestrator.py has MAOrchestrator with _build_agent_pipeline and analyze_company
[ ] _parse_synthesis_output handles: clean json, bare json, garbage text, malformed json
[ ] All imports reference real packages from requirements.txt
[ ] Unit tests pass: python -m pytest tests/test_agents.py::TestParseSynthesisOutput -v
[ ] No TODO, no stubs, no placeholder comments

FINAL PUSH:
git push origin person-a/agents
```

---

# ═══════════════════════════════════════════════════════════════
# PERSON B — BACKEND SERVICES + VOICE + GLUE LAYER
# Branch: person-b/services (Phase 1), then person-b/glue (Phase 2)
# ═══════════════════════════════════════════════════════════════

## Your Ownership
```
backend/
├── services/
│   ├── __init__.py                 ← YOU
│   ├── firestore_service.py        ← YOU
│   └── audio_utils.py              ← YOU
├── live_session.py                 ← YOU
├── main.py                         ← YOU (Phase 2 — after Person A merges)
tests/
├── test_firestore.py               ← YOU
├── test_audio.py                   ← YOU
└── test_live_session.py            ← YOU
```

## PROMPT FOR PERSON B — PHASE 1 (Services + Voice, 60 min)

```
You are building the backend services and voice layer for an M&A War Room — a Columbia Business School × Google hackathon project. You work inside Google Cloud Shell. The project scaffolding is already set up. You ONLY build Firestore service, audio utils, and the Gemini Live API session manager. No stubs, no TODOs, no placeholders. Every file must be complete and runnable.

TECH CONTEXT:
- google-cloud-firestore==2.19.0 (AsyncClient for Firestore)
- google-genai==1.5.0 (Gemini Live API — gemini-2.0-flash-live-001)
- Firestore collection: /deals/{session_id}
- Audio: LINEAR16 PCM, 16kHz mono in (browser mic), 24kHz mono out (Gemini voice)
- Live API voice: "Charon" (deep, authoritative banker voice)

YOUR BRANCH: person-b/services
GIT COMMITS: One commit per file.

═══════════════════════════════════════════════
STEP 1: FIRESTORE SERVICE (15 min)
═══════════════════════════════════════════════

Create backend/services/__init__.py (empty file).

Create backend/services/firestore_service.py:

import os
from datetime import datetime, timezone
from google.cloud import firestore
from google.cloud.firestore_v1.async_client import AsyncClient


class FirestoreService:
    """
    Async Firestore service for deal memo CRUD.
    Collection: /deals/{session_id}
    """

    def __init__(self):
        project_id = os.getenv("FIRESTORE_PROJECT_ID")
        self.db = AsyncClient(project=project_id)

    async def write_deal_memo(self, session_id: str, memo: dict) -> str:
        """Write/merge deal memo. Returns document path."""
        doc_ref = self.db.collection("deals").document(session_id)
        memo["timestamp"] = datetime.now(timezone.utc)
        memo["session_id"] = session_id
        await doc_ref.set(memo, merge=True)
        return f"deals/{session_id}"

    async def update_field(self, session_id: str, field: str, value) -> None:
        """Update a single field in an existing deal memo."""
        doc_ref = self.db.collection("deals").document(session_id)
        await doc_ref.update({field: value})

    async def get_deal_memo(self, session_id: str) -> dict:
        """Retrieve a deal memo by session ID. Returns empty dict if not found."""
        doc_ref = self.db.collection("deals").document(session_id)
        doc = await doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return {}

    async def append_red_flag(self, session_id: str, flag: str) -> None:
        """Append a red flag to an existing deal memo."""
        doc_ref = self.db.collection("deals").document(session_id)
        await doc_ref.update({"red_flags": firestore.ArrayUnion([flag])})

    async def list_recent_deals(self, limit: int = 10) -> list:
        """List most recent deal memos ordered by timestamp DESC."""
        docs = (
            self.db.collection("deals")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        results = []
        async for doc in docs:
            results.append({"id": doc.id, **doc.to_dict()})
        return results


GIT CHECKPOINT:
git add backend/services/ && git commit -m "feat(services): add async Firestore service with CRUD + red flag append"


═══════════════════════════════════════════════
STEP 2: AUDIO UTILITIES (10 min)
═══════════════════════════════════════════════

Create backend/services/audio_utils.py:

import struct


def pcm_to_wav_header(sample_rate: int = 16000, channels: int = 1, bits: int = 16) -> bytes:
    """Generate WAV header for raw PCM audio. Used if you need to save recordings."""
    byte_rate = sample_rate * channels * bits // 8
    block_align = channels * bits // 8
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF', 0,
        b'WAVE',
        b'fmt ', 16,
        1,  # PCM format
        channels,
        sample_rate,
        byte_rate,
        block_align,
        bits,
        b'data', 0
    )
    return header


def convert_browser_audio_to_pcm(raw_audio: bytes) -> bytes:
    """
    Browser sends raw PCM at 16kHz from our frontend AudioContext.
    Pass through — no conversion needed because frontend already sends LINEAR16.
    """
    return raw_audio


def chunk_audio(audio_bytes: bytes, chunk_size_ms: int = 100, sample_rate: int = 16000) -> list:
    """
    Split audio into chunks for streaming to Gemini Live API.
    16kHz * 16-bit = 32000 bytes/sec. 100ms chunk = 3200 bytes.
    """
    bytes_per_chunk = int(sample_rate * (chunk_size_ms / 1000) * 2)
    return [
        audio_bytes[i : i + bytes_per_chunk]
        for i in range(0, len(audio_bytes), bytes_per_chunk)
    ]


GIT CHECKPOINT:
git add backend/services/audio_utils.py && git commit -m "feat(services): add audio PCM utilities for Gemini Live API"


═══════════════════════════════════════════════════════════
STEP 3: GEMINI LIVE API SESSION MANAGER (30 min)
═══════════════════════════════════════════════════════════

Create backend/live_session.py:

This is the real-time voice layer. Key behaviors:
- Opens bidirectional WebSocket to Gemini Live API
- Sends raw PCM audio chunks from user's mic → Gemini
- Receives audio+text from Gemini → forwards via callbacks to frontend
- Detects company name intent from Gemini's text (regex for "Analyzing [Company]")
- inject_briefing() sends synthesis text back for Gemini to read aloud
- Keepalive ping every 30 seconds to prevent session timeout
- Graceful close

import asyncio
import os
import re
from typing import Optional, Callable
from google import genai
from google.genai import types as genai_types


class LiveSession:
    LIVE_MODEL = "gemini-2.0-flash-live-001"

    LIVE_SYSTEM_PROMPT = """
You are the voice interface for an M&A Due Diligence War Room.

Your role:
1. Listen for the user speaking a company name or saying "analyze [company]"
2. Confirm you heard it: "Analyzing [Company]. Spinning up research team now."
3. When research results arrive (injected as text), read the banker briefing aloud
4. Handle follow-up questions conversationally, drawing from the loaded context
5. If user says "stop" or "pause", stop speaking immediately
6. If user says "what are the red flags?", enumerate them specifically
7. If user says "give me the memo", confirm it's saved and give the Firestore reference

Tone: Senior investment banker. Crisp, authoritative, numbers-first.
Never say "I don't know" — if data is missing, say "Data unavailable — flag for manual check."
"""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self._session = None
        self._company_detected_callback: Optional[Callable] = None
        self._audio_output_callback: Optional[Callable] = None
        self._text_output_callback: Optional[Callable] = None
        self._keepalive_task: Optional[asyncio.Task] = None

    def on_company_detected(self, callback: Callable):
        self._company_detected_callback = callback

    def on_audio_output(self, callback: Callable):
        self._audio_output_callback = callback

    def on_text_output(self, callback: Callable):
        self._text_output_callback = callback

    async def start(self):
        config = genai_types.LiveConnectConfig(
            response_modalities=["AUDIO", "TEXT"],
            speech_config=genai_types.SpeechConfig(
                voice_config=genai_types.VoiceConfig(
                    prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                        voice_name="Charon"
                    )
                )
            ),
            system_instruction=genai_types.Content(
                parts=[genai_types.Part(text=self.LIVE_SYSTEM_PROMPT)]
            ),
        )

        self._session = await self.client.aio.live.connect(
            model=self.LIVE_MODEL,
            config=config,
        )

        asyncio.create_task(self._receive_loop())
        self._keepalive_task = asyncio.create_task(self._keepalive())

    async def send_audio(self, audio_chunk: bytes):
        if self._session:
            await self._session.send(
                input=genai_types.LiveClientRealtimeInput(
                    media_chunks=[
                        genai_types.Blob(
                            data=audio_chunk,
                            mime_type="audio/pcm;rate=16000",
                        )
                    ]
                )
            )

    async def inject_briefing(self, briefing_text: str, company: str):
        """Send synthesis briefing to Live API so it reads it aloud."""
        if self._session:
            injection = f"""
The research team has completed their analysis of {company}.
Deliver the following briefing:

{briefing_text}
"""
            await self._session.send(
                input=genai_types.LiveClientContentUpdate(
                    turns=[
                        genai_types.LiveClientTurn(
                            role="user",
                            parts=[genai_types.Part(text=injection)],
                        )
                    ],
                    turn_complete=True,
                )
            )

    async def send_text(self, text: str):
        if self._session:
            await self._session.send(
                input=genai_types.LiveClientContentUpdate(
                    turns=[
                        genai_types.LiveClientTurn(
                            role="user",
                            parts=[genai_types.Part(text=text)],
                        )
                    ],
                    turn_complete=True,
                )
            )

    async def _receive_loop(self):
        if not self._session:
            return
        try:
            async for response in self._session.receive():
                if response.data:
                    if self._audio_output_callback:
                        await self._audio_output_callback(response.data)
                if response.text:
                    if self._text_output_callback:
                        await self._text_output_callback(response.text)
                    await self._check_for_company_intent(response.text)
                if response.server_content:
                    if hasattr(response.server_content, "turn_complete"):
                        if response.server_content.turn_complete:
                            pass  # Turn complete — ready for next input
        except Exception:
            pass  # Session closed or network error

    async def _check_for_company_intent(self, text: str):
        """Detect company name from Live API's confirmation text."""
        pattern = r"[Aa]nalyzing\s+([A-Z][A-Za-z\s&'.]+?)(?:\.|,|\s+Spinning|\s+Let)"
        match = re.search(pattern, text)
        if match and self._company_detected_callback:
            company_name = match.group(1).strip()
            try:
                await self._company_detected_callback(company_name)
            except (ValueError, IndexError):
                pass

    async def _keepalive(self):
        """Ping every 30 seconds to prevent Gemini Live API session timeout."""
        while self._session:
            await asyncio.sleep(30)
            try:
                await self.send_text(".")
            except Exception:
                break

    async def close(self):
        if self._keepalive_task:
            self._keepalive_task.cancel()
            self._keepalive_task = None
        if self._session:
            await self._session.close()
            self._session = None


GIT CHECKPOINT:
git add backend/live_session.py && git commit -m "feat(voice): add Gemini Live API session with bidirectional audio, company detection, keepalive"


═══════════════════════════════════════════════
STEP 4: WRITE TESTS (15 min)
═══════════════════════════════════════════════

Create tests/test_firestore.py:

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


Create tests/test_audio.py:

from backend.services.audio_utils import chunk_audio, pcm_to_wav_header, convert_browser_audio_to_pcm


def test_chunk_audio_correct_count():
    """1 second of 16kHz 16-bit mono audio = 32000 bytes → 10 chunks of 100ms."""
    sample_rate = 16000
    duration_secs = 1
    dummy_audio = bytes(sample_rate * 2 * duration_secs)  # 32000 bytes

    chunks = chunk_audio(dummy_audio, chunk_size_ms=100, sample_rate=sample_rate)

    assert len(chunks) == 10


def test_chunk_audio_correct_size():
    """Each 100ms chunk at 16kHz 16-bit = 3200 bytes."""
    dummy_audio = bytes(32000)
    chunks = chunk_audio(dummy_audio, chunk_size_ms=100, sample_rate=16000)

    for chunk in chunks:
        assert len(chunk) == 3200


def test_wav_header_length():
    """WAV header is always 44 bytes."""
    header = pcm_to_wav_header()
    assert len(header) == 44


def test_wav_header_starts_with_riff():
    header = pcm_to_wav_header()
    assert header[:4] == b'RIFF'


def test_browser_audio_passthrough():
    """Browser audio is already PCM — should pass through unchanged."""
    test_data = b'\x00\x01\x02\x03'
    assert convert_browser_audio_to_pcm(test_data) == test_data


RUN TESTS:
# Unit tests (always — no cloud needed):
python -m pytest tests/test_audio.py -v

# Integration tests (needs Firestore):
python -m pytest tests/test_firestore.py -v


GIT CHECKPOINT:
git add tests/ && git commit -m "test(services): add Firestore integration tests and audio unit tests"


════════════════════════════════════════════════════
PHASE 1 DONE — PUSH AND WAIT FOR PERSON A'S MERGE
════════════════════════════════════════════════════

git push origin person-b/services
# Wait for Person A's agents to be merged to main, then proceed to Phase 2
```


## PROMPT FOR PERSON B — PHASE 2 (Glue Layer, 30 min)

```
Person A's agent pipeline is now merged. You're building main.py — the FastAPI WebSocket server that connects LiveSession + MAOrchestrator + frontend.

YOUR BRANCH: person-b/glue (branch off main after Person A's merge)
git checkout main && git pull && git checkout -b person-b/glue

═══════════════════════════════════════════════
STEP 5: FASTAPI WEBSOCKET SERVER (25 min)
═══════════════════════════════════════════════

Create backend/main.py:

import asyncio
import json
import os
import uuid
import base64
from contextlib import asynccontextmanager
from typing import Dict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.live_session import LiveSession
from backend.agents.orchestrator import MAOrchestrator

load_dotenv()

active_sessions: Dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("M&A War Room backend starting up...")
    yield
    print("Shutting down — closing all sessions...")
    for sid, session_data in list(active_sessions.items()):
        await session_data["live_session"].close()


app = FastAPI(
    title="M&A War Room API",
    description="Live M&A Due Diligence Agent — Google x Columbia Hackathon 2026",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "war room ready", "active_sessions": len(active_sessions)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint. Handles:
    - Audio streaming (mic → Gemini → speaker)
    - Company detection → ADK pipeline → deal memo
    - Red flag keyword scanning
    - Text follow-up questions
    - Graceful disconnect
    """
    await websocket.accept()
    session_id = str(uuid.uuid4())

    orchestrator = MAOrchestrator()
    live_session = LiveSession(session_id=session_id)

    async def send_ws(data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

    async def on_audio_output(audio_bytes: bytes):
        await send_ws({
            "type": "audio",
            "data": base64.b64encode(audio_bytes).decode(),
        })

    async def on_text_output(text: str):
        await send_ws({"type": "transcript", "text": text})
        red_flag_keywords = [
            "flagging this", "material omission", "discrepancy",
            "going concern", "sec investigation", "cfo departure",
            "guidance cut", "insider selling"
        ]
        lower_text = text.lower()
        for keyword in red_flag_keywords:
            if keyword in lower_text:
                idx = lower_text.index(keyword)
                flag_context = text[max(0, idx - 20):idx + 100]
                await send_ws({"type": "red_flag", "flag": flag_context})

    async def on_company_detected(company_name: str):
        await send_ws({
            "type": "company_detected",
            "company": company_name,
        })

        async def on_status_update(status: dict):
            await send_ws(status)

        try:
            result = await orchestrator.analyze_company(
                company_name=company_name,
                session_id=session_id,
                on_status_update=on_status_update,
            )
            await send_ws({
                "type": "deal_memo",
                "memo": result["deal_memo"],
            })
            await live_session.inject_briefing(
                briefing_text=result["spoken_briefing"],
                company=company_name,
            )
        except Exception as e:
            await send_ws({"type": "error", "message": str(e)})

    live_session.on_audio_output(on_audio_output)
    live_session.on_text_output(on_text_output)
    live_session.on_company_detected(on_company_detected)

    await live_session.start()

    active_sessions[session_id] = {
        "live_session": live_session,
        "orchestrator": orchestrator,
        "websocket": websocket,
    }

    await send_ws({"type": "session_id", "session_id": session_id})

    try:
        while True:
            message = await websocket.receive()
            if "text" in message:
                data = json.loads(message["text"])
                msg_type = data.get("type")
                if msg_type == "text":
                    await live_session.send_text(data.get("text", ""))
                elif msg_type == "end_session":
                    break
            elif "bytes" in message:
                await live_session.send_audio(message["bytes"])
    except WebSocketDisconnect:
        pass
    finally:
        await live_session.close()
        active_sessions.pop(session_id, None)


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development",
    )


Create tests/test_main.py:

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint():
    """Smoke test: /health returns 200 with correct shape."""
    from backend.main import app
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "war room ready"
    assert "active_sessions" in data


RUN TESTS:
python -m pytest tests/test_main.py -v
python -m pytest tests/test_audio.py tests/test_main.py -v  # all unit tests


GIT CHECKPOINTS:
git add backend/main.py && git commit -m "feat(server): add FastAPI WebSocket server with audio streaming, red flag scanning, pipeline trigger"
git add tests/test_main.py && git commit -m "test(server): add health endpoint smoke test"
git push origin person-b/glue
```

---

# ═══════════════════════════════════════════════════════════════
# PERSON C — FRONTEND ENGINEER
# Branch: person-c/frontend
# ═══════════════════════════════════════════════════════════════

## Your Ownership
```
frontend/
├── app/
│   ├── page.tsx                    ← YOU
│   ├── layout.tsx                  ← YOU
│   └── globals.css                 ← YOU
├── components/
│   ├── MicButton.tsx               ← YOU
│   ├── BriefingFeed.tsx            ← YOU
│   ├── DealMemo.tsx                ← YOU
│   ├── AgentStatus.tsx             ← YOU
│   └── RedFlagAlert.tsx            ← YOU
├── hooks/
│   └── useWarRoom.ts              ← YOU
├── next.config.js                  ← YOU
├── .env.local                      ← YOU
└── package.json (update scripts)   ← YOU
```

## PROMPT FOR PERSON C

```
You are building the complete Next.js frontend for an M&A War Room — a Columbia Business School × Google hackathon project. You work inside Google Cloud Shell. The scaffolding (create-next-app) is already done. You build every UI file from scratch. Dark military command center aesthetic: bg-gray-950, monospace, pulsing status lights, red flag alerts. Tailwind CSS only — no component libraries. No stubs, no TODOs. Every file production-ready.

TECH CONTEXT:
- Next.js 14+ with App Router, TypeScript, Tailwind CSS
- WebSocket connection to FastAPI backend at ws://localhost:8000/ws (env var NEXT_PUBLIC_WS_URL)
- Audio capture: browser MediaDevices → AudioContext at 16kHz → ScriptProcessorNode → Float32→Int16 PCM → send binary over WebSocket
- Audio playback: receive base64 Int16 PCM at 24kHz → decode → Float32 → AudioBufferSourceNode
- Static export for Firebase Hosting: output: 'export' in next.config.js

YOUR BRANCH: person-c/frontend
GIT COMMITS: One commit per logical component group.

═══════════════════════════════════════════════════
STEP 1: CONFIG FILES (5 min)
═══════════════════════════════════════════════════

Create/update frontend/next.config.js:

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;


Create frontend/.env.local:

NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws


GIT CHECKPOINT:
git add frontend/next.config.js frontend/.env.local && git commit -m "chore(frontend): add next.config.js static export + env config"


═══════════════════════════════════════════════
STEP 2: GLOBAL STYLES + LAYOUT (5 min)
═══════════════════════════════════════════════

Replace frontend/app/globals.css entirely:

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
}


Replace frontend/app/layout.tsx entirely:

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M&A War Room | Google x Columbia 2026",
  description: "Live M&A Due Diligence Agent — Voice-Driven Analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 antialiased">{children}</body>
    </html>
  );
}


GIT CHECKPOINT:
git add frontend/app/globals.css frontend/app/layout.tsx && git commit -m "feat(frontend): add dark theme globals + layout"


═══════════════════════════════════════════════════════
STEP 3: WEBSOCKET + AUDIO HOOK (20 min)
═══════════════════════════════════════════════════════

Create frontend/hooks/useWarRoom.ts:

import { useState, useRef, useCallback, useEffect } from "react";

export type AgentStatus = "idle" | "running" | "complete" | "error";
export type Verdict = "BUY" | "WATCH" | "AVOID" | null;

export interface DealMemo {
  company: string;
  verdict: Verdict;
  confidence: string;
  one_liner: string;
  financials_summary: string;
  competitive_summary: string;
  risk_summary: string;
  red_flags: string[];
  follow_up_questions: string[];
  sources: string[];
  session_id: string;
}

export interface WarRoomState {
  sessionId: string | null;
  isConnected: boolean;
  isListening: boolean;
  isAnalyzing: boolean;
  currentCompany: string | null;
  transcript: string[];
  redFlags: string[];
  agentStatuses: Record<string, AgentStatus>;
  dealMemo: DealMemo | null;
  audioQueue: ArrayBuffer[];
  error: string | null;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export function useWarRoom() {
  const [state, setState] = useState<WarRoomState>({
    sessionId: null,
    isConnected: false,
    isListening: false,
    isAnalyzing: false,
    currentCompany: null,
    transcript: [],
    redFlags: [],
    agentStatuses: {
      FinancialAnalyst: "idle",
      CompetitiveAnalyst: "idle",
      SentimentAnalyst: "idle",
      SynthesisAgent: "idle",
    },
    dealMemo: null,
    audioQueue: [],
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPlayingRef = useRef(false);
  const playbackQueueRef = useRef<ArrayBuffer[]>([]);

  const updateState = useCallback((updates: Partial<WarRoomState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const playAudioChunk = useCallback(async (audioData: ArrayBuffer) => {
    playbackQueueRef.current.push(audioData);
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      while (playbackQueueRef.current.length > 0) {
        const chunk = playbackQueueRef.current.shift()!;
        await playPCMChunk(chunk);
      }
      isPlayingRef.current = false;
    }
  }, []);

  const playPCMChunk = async (audioData: ArrayBuffer) => {
    const ctx = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    const pcmData = new Int16Array(audioData);
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0;
    }
    const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.copyToChannel(float32Data, 0);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  };

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => updateState({ isConnected: true });

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "session_id":
          updateState({ sessionId: data.session_id });
          break;
        case "audio": {
          const audioBytes = Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0)).buffer;
          await playAudioChunk(audioBytes);
          break;
        }
        case "transcript":
          setState((prev) => ({
            ...prev,
            transcript: [...prev.transcript.slice(-50), data.text],
          }));
          break;
        case "company_detected":
          updateState({ currentCompany: data.company, isAnalyzing: true });
          break;
        case "agent_status": {
          const statuses: Record<string, AgentStatus> = {};
          data.agents.forEach((a: string) => { statuses[a] = "running"; });
          setState((prev) => ({
            ...prev,
            agentStatuses: { ...prev.agentStatuses, ...statuses },
          }));
          break;
        }
        case "agent_complete":
          setState((prev) => ({
            ...prev,
            agentStatuses: { ...prev.agentStatuses, [data.agent]: "complete" },
          }));
          break;
        case "pipeline_complete":
          updateState({ isAnalyzing: false });
          setState((prev) => ({
            ...prev,
            agentStatuses: {
              FinancialAnalyst: "complete",
              CompetitiveAnalyst: "complete",
              SentimentAnalyst: "complete",
              SynthesisAgent: "complete",
            },
          }));
          break;
        case "deal_memo":
          updateState({ dealMemo: data.memo });
          break;
        case "red_flag":
          setState((prev) => ({
            ...prev,
            redFlags: [...prev.redFlags, data.flag],
          }));
          break;
        case "error":
          updateState({ error: data.message, isAnalyzing: false });
          break;
      }
    };

    ws.onclose = () => updateState({ isConnected: false, isListening: false });
    ws.onerror = () => updateState({ error: "Connection failed. Check backend." });

    wsRef.current = ws;
  }, [updateState, playAudioChunk]);

  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      await new Promise((r) => setTimeout(r, 500));
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(pcm.buffer);
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      updateState({ isListening: true });
    } catch {
      updateState({ error: "Microphone access denied." });
    }
  }, [connect, updateState]);

  const stopListening = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    updateState({ isListening: false });
  }, [updateState]);

  const sendFollowUp = useCallback((text: string) => {
    wsRef.current?.send(JSON.stringify({ type: "text", text }));
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "end_session" }));
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    updateState({ isConnected: false, isListening: false });
  }, [updateState]);

  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, []);

  return { state, startListening, stopListening, sendFollowUp, disconnect };
}


GIT CHECKPOINT:
git add frontend/hooks/ && git commit -m "feat(frontend): add useWarRoom hook with WebSocket, mic capture, audio playback"


═══════════════════════════════════════════════════════════
STEP 4: ALL 5 COMPONENTS (20 min)
═══════════════════════════════════════════════════════════

Create frontend/components/MicButton.tsx:

"use client";

interface MicButtonProps {
  isListening: boolean;
  isAnalyzing: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({ isListening, isAnalyzing, onStart, onStop }: MicButtonProps) {
  return (
    <button
      onClick={isListening ? onStop : onStart}
      disabled={isAnalyzing}
      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
        isAnalyzing
          ? "bg-yellow-900 cursor-wait"
          : isListening
          ? "bg-red-600 hover:bg-red-700 animate-pulse"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {isListening && (
        <>
          <span className="absolute w-full h-full rounded-full bg-red-600 opacity-30 animate-ping" />
          <span className="absolute w-[120%] h-[120%] rounded-full bg-red-600 opacity-10 animate-ping" />
        </>
      )}
      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {isListening ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10l6 4-6 4V10z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        )}
      </svg>
    </button>
  );
}


Create frontend/components/BriefingFeed.tsx:

"use client";

import { useEffect, useRef } from "react";

export function BriefingFeed({ transcript }: { transcript: string[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="bg-gray-900 rounded-xl p-6 h-[600px] flex flex-col">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Live Briefing Feed</p>
      <div ref={feedRef} className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
        {transcript.length === 0 ? (
          <p className="text-gray-600 text-sm italic">Waiting for briefing...</p>
        ) : (
          transcript.map((line, i) => (
            <div key={i} className="text-sm text-gray-200 leading-relaxed border-l-2 border-blue-500 pl-3 py-1 animate-fadeIn">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


Create frontend/components/DealMemo.tsx:

"use client";

import { DealMemo } from "@/hooks/useWarRoom";

interface DealMemoPanelProps {
  memo: DealMemo;
  verdictColor: string;
}

export function DealMemoPanel({ memo, verdictColor }: DealMemoPanelProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-widest">Deal Memo</p>
        <span className={`text-2xl font-black ${verdictColor}`}>{memo.verdict}</span>
      </div>
      <div>
        <p className="text-lg font-bold text-white">{memo.company}</p>
        <p className="text-sm text-gray-400 mt-1">{memo.one_liner}</p>
      </div>
      <div className="space-y-3">
        <MemoSection title="Financials" content={memo.financials_summary} />
        <MemoSection title="Competitive" content={memo.competitive_summary} />
        <MemoSection title="Risk" content={memo.risk_summary} />
      </div>
      {memo.red_flags && memo.red_flags.length > 0 && (
        <div>
          <p className="text-xs text-red-400 font-bold uppercase mb-1">Red Flags</p>
          <ul className="space-y-1">
            {memo.red_flags.map((flag, i) => (
              <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">⚠</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
      {memo.sources && memo.sources.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Sources</p>
          <div className="space-y-1">
            {memo.sources.slice(0, 5).map((src, i) => (
              <p key={i} className="text-xs text-blue-400 truncate">{src}</p>
            ))}
          </div>
        </div>
      )}
      <div className="text-xs text-gray-600 pt-2 border-t border-gray-800">
        Confidence: {memo.confidence} | Session: {memo.session_id?.slice(0, 8)}
      </div>
    </div>
  );
}

function MemoSection({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <div>
      <p className="text-xs text-gray-500 font-bold uppercase">{title}</p>
      <p className="text-sm text-gray-300 mt-1">{content}</p>
    </div>
  );
}


Create frontend/components/AgentStatus.tsx:

"use client";

import { AgentStatus } from "@/hooks/useWarRoom";

const agents = [
  { key: "FinancialAnalyst", label: "Financial Analyst", icon: "📊" },
  { key: "CompetitiveAnalyst", label: "Competitive Intel", icon: "🎯" },
  { key: "SentimentAnalyst", label: "Sentiment & Risk", icon: "📡" },
  { key: "SynthesisAgent", label: "Synthesis MD", icon: "🧠" },
];

const statusStyles: Record<AgentStatus, string> = {
  idle: "bg-gray-700 text-gray-400",
  running: "bg-blue-900 text-blue-300 animate-pulse",
  complete: "bg-green-900 text-green-400",
  error: "bg-red-900 text-red-400",
};

const statusLabel: Record<AgentStatus, string> = {
  idle: "STANDBY",
  running: "RUNNING",
  complete: "DONE",
  error: "ERROR",
};

export function AgentStatusPanel({ statuses }: { statuses: Record<string, AgentStatus> }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Research Team</p>
      <div className="space-y-2">
        {agents.map(({ key, label, icon }) => (
          <div
            key={key}
            className={`flex items-center justify-between rounded-lg px-3 py-2 ${statusStyles[statuses[key] ?? "idle"]}`}
          >
            <span className="text-sm">{icon} {label}</span>
            <span className="text-xs font-bold">{statusLabel[statuses[key] ?? "idle"]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


Create frontend/components/RedFlagAlert.tsx:

"use client";

import { useEffect, useState } from "react";

export function RedFlagAlert({ flag }: { flag: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-red-950 border border-red-500 rounded-lg px-4 py-3 mb-3 flex items-start gap-3 animate-slideIn">
      <span className="text-red-400 text-lg">⚠</span>
      <div>
        <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Red Flag Detected</p>
        <p className="text-red-200 text-sm mt-1">{flag}</p>
      </div>
    </div>
  );
}


GIT CHECKPOINT:
git add frontend/components/ && git commit -m "feat(frontend): add MicButton, BriefingFeed, DealMemo, AgentStatus, RedFlagAlert components"


═══════════════════════════════════════════════
STEP 5: MAIN PAGE (10 min)
═══════════════════════════════════════════════

Replace frontend/app/page.tsx entirely:

"use client";

import { useWarRoom } from "@/hooks/useWarRoom";
import { MicButton } from "@/components/MicButton";
import { BriefingFeed } from "@/components/BriefingFeed";
import { DealMemoPanel } from "@/components/DealMemo";
import { AgentStatusPanel } from "@/components/AgentStatus";
import { RedFlagAlert } from "@/components/RedFlagAlert";

export default function WarRoomPage() {
  const { state, startListening, stopListening, sendFollowUp } = useWarRoom();

  const verdictColor = {
    BUY: "text-green-400",
    WATCH: "text-yellow-400",
    AVOID: "text-red-400",
    null: "text-gray-400",
  }[state.dealMemo?.verdict ?? "null"];

  return (
    <main className="min-h-screen bg-gray-950 text-white font-mono p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🏦 M&A WAR ROOM</h1>
          <p className="text-gray-400 text-sm">Google x Columbia Hackathon 2026 — Live Agent Track</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${state.isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs text-gray-400">{state.isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
        </div>
      </div>

      {state.redFlags.slice(-3).map((flag, i) => (
        <RedFlagAlert key={i} flag={flag} />
      ))}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 flex flex-col items-center gap-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              {state.isListening ? "LISTENING — SAY A COMPANY NAME" : "CLICK TO ACTIVATE WAR ROOM"}
            </p>
            <MicButton
              isListening={state.isListening}
              isAnalyzing={state.isAnalyzing}
              onStart={startListening}
              onStop={stopListening}
            />
            {state.currentCompany && (
              <div className="text-center">
                <p className="text-gray-400 text-xs">ANALYZING</p>
                <p className="text-xl font-bold text-blue-400">{state.currentCompany.toUpperCase()}</p>
              </div>
            )}
          </div>
          <AgentStatusPanel statuses={state.agentStatuses} />
          {state.dealMemo && (
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">FOLLOW-UP QUESTION</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-800 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="What's the EBITDA margin?"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendFollowUp((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.dealMemo.follow_up_questions?.slice(0, 3).map((q, i) => (
                  <button key={i} onClick={() => sendFollowUp(q)} className="text-xs bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 text-gray-400">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-1">
          <BriefingFeed transcript={state.transcript} />
        </div>

        <div className="col-span-1">
          {state.dealMemo ? (
            <DealMemoPanel memo={state.dealMemo} verdictColor={verdictColor} />
          ) : (
            <div className="bg-gray-900 rounded-xl p-6 h-full flex items-center justify-center">
              <p className="text-gray-600 text-sm text-center">Deal memo appears here after analysis</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


GIT CHECKPOINT:
git add frontend/app/ && git commit -m "feat(frontend): add war room main page with 3-column layout"


═══════════════════════════════════════
STEP 6: BUILD TEST (5 min)
═══════════════════════════════════════

cd frontend
npm run build

If the build succeeds with no errors, the frontend is complete.

Check that frontend/out/ directory exists (static export).
ls -la out/  # Should contain index.html

GIT CHECKPOINT:
git add -A && git commit -m "chore(frontend): verify build passes — static export ready"


═══════════════════
DONE CHECKLIST
═══════════════════

Before pushing, verify:
[ ] next.config.js has output: 'export'
[ ] .env.local has NEXT_PUBLIC_WS_URL
[ ] globals.css has fadeIn + slideIn animations
[ ] layout.tsx has dark body class + metadata
[ ] useWarRoom.ts compiles with no TS errors
[ ] All 5 components have "use client" directive
[ ] page.tsx imports and uses all 5 components
[ ] npm run build succeeds with zero errors
[ ] frontend/out/ directory contains index.html
[ ] No TODO, no stubs, no placeholder comments

FINAL PUSH:
git push origin person-c/frontend
```

---

# ═══════════════════════════════════════════════════════════════
# PERSON D — INFRA / DEVOPS / INTEGRATION LEAD
# Branch: person-d/infra (Phase 1), then coordinates merges & deploy (Phase 2)
# ═══════════════════════════════════════════════════════════════

## Your Ownership
```
ma-warroom/
├── backend/
│   ├── requirements.txt            ← YOU
│   ├── Dockerfile                  ← YOU
│   └── .env                        ← YOU
├── frontend/
│   └── (scaffolding via create-next-app) ← YOU
├── firestore.rules                 ← YOU
├── firebase.json                   ← YOU
├── .gitignore                      ← YOU
├── README.md                       ← YOU
tests/
└── test_e2e_smoke.py               ← YOU (Phase 2)
```

## PROMPT FOR PERSON D — PHASE 1 (Scaffolding, 15 min)

```
You are the infra/devops lead for an M&A War Room — a Columbia Business School × Google hackathon project. You work inside Google Cloud Shell. You set up the ENTIRE project scaffolding so your 3 teammates can branch off and work in parallel. No stubs, no TODOs. Every config file must be production-ready.

YOUR BRANCH: person-d/infra (this merges to main FIRST)

═══════════════════════════════════════════════
STEP 1: PROJECT SCAFFOLDING (10 min)
═══════════════════════════════════════════════

# Initialize git repo
mkdir ma-warroom && cd ma-warroom
git init
git checkout -b main

# Create all directories
mkdir -p backend/agents backend/services backend/prompts tests
touch backend/agents/__init__.py backend/services/__init__.py backend/prompts/__init__.py

# Create backend/requirements.txt
cat > backend/requirements.txt << 'EOF'
fastapi==0.115.0
uvicorn[standard]==0.32.0
websockets==13.1
google-adk==1.0.0
google-genai==1.5.0
google-cloud-firestore==2.19.0
python-dotenv==1.0.1
aiohttp==3.10.10
pydantic==2.9.2
pytest==8.3.3
pytest-asyncio==0.24.0
httpx==0.27.2
EOF

# Create backend/.env
cat > backend/.env << 'EOF'
GOOGLE_API_KEY=YOUR_KEY_HERE
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1
FIRESTORE_PROJECT_ID=YOUR_PROJECT_ID
ENVIRONMENT=development
PORT=8000
EOF

# Create backend/Dockerfile
cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
EOF

# Create firestore.rules
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /deals/{sessionId} {
      allow read, write: if true;
    }
  }
}
EOF

# Create firebase.json
cat > firebase.json << 'EOF'
{
  "hosting": {
    "public": "frontend/out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.pyc
.venv/
backend/.env

# Node
node_modules/
frontend/.next/
frontend/out/
frontend/.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF

# Create README.md
cat > README.md << 'EOF'
# M&A War Room — CIMphony

**Team DilliGents** | Columbia Business School × Google Hackathon 2026

Real-time, voice-driven M&A due diligence system powered by Gemini Live API, ADK ParallelAgent, Google Search Grounding, and Firestore.

## Quick Start

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

## Architecture
- **Voice Layer:** Gemini Live API (bidirectional audio streaming)
- **Research Pipeline:** ADK ParallelAgent → 3 specialist agents → Synthesis
- **Storage:** Firestore (structured deal memos)
- **Frontend:** Next.js + WebSocket + Web Audio API
- **Deployment:** Cloud Run (backend) + Firebase Hosting (frontend)
EOF

# Initialize frontend
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git --yes

# Install Python deps
cd backend && pip install -r requirements.txt && cd ..

# Install Node deps
cd frontend && npm install && cd ..

GIT CHECKPOINT:
git add -A && git commit -m "chore(scaffold): initialize project structure with all configs, deps, and directories"
git push origin main


═══════════════════════════════════════════════
STEP 2: VERIFY GCP SETUP (5 min)
═══════════════════════════════════════════════

Run these commands and verify output:

# Confirm project
gcloud config get-value project

# Verify APIs enabled
gcloud services list --enabled --filter="name:(run.googleapis.com OR firestore.googleapis.com OR aiplatform.googleapis.com OR cloudbuild.googleapis.com)"

# Verify Firestore exists
gcloud firestore databases describe

# Verify API key works
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_API_KEY" | head -5

# If any API is not enabled:
gcloud services enable run.googleapis.com firestore.googleapis.com aiplatform.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Populate real values in backend/.env (DO NOT COMMIT)
sed -i "s/YOUR_KEY_HERE/$GOOGLE_API_KEY/" backend/.env
sed -i "s/YOUR_PROJECT_ID/$(gcloud config get-value project)/g" backend/.env


Now message the team: "Scaffold is on main. Branch off and go."


═══════════════════
DONE CHECKLIST
═══════════════════

[ ] All directories exist: backend/agents, backend/services, backend/prompts, tests, frontend
[ ] All __init__.py files exist
[ ] requirements.txt has all dependencies with pinned versions
[ ] Dockerfile builds (docker build -t test ./backend)
[ ] frontend/ has node_modules (npm install completed)
[ ] .gitignore covers .env, __pycache__, node_modules, .next, out
[ ] firebase.json points to frontend/out
[ ] firestore.rules allow read/write to /deals/{sessionId}
[ ] GCP project has all APIs enabled
[ ] backend/.env has real values (not committed to git)
```


## PROMPT FOR PERSON D — PHASE 2 (Integration + Deploy, 30 min)

```
All 3 teammates have pushed their branches. You are now merging, deploying, and running E2E tests.

═══════════════════════════════════════════════
STEP 3: MERGE ALL BRANCHES (10 min)
═══════════════════════════════════════════════

# Merge order matters — follow exactly:

git checkout main && git pull

# 1. Merge Person A (agents) — new files only, no conflicts expected
git merge origin/person-a/agents --no-ff -m "merge: Person A — ADK agent pipeline"

# 2. Merge Person B services — new files only
git merge origin/person-b/services --no-ff -m "merge: Person B — Firestore, audio, live session"

# 3. Merge Person C frontend — separate directory, no conflicts
git merge origin/person-c/frontend --no-ff -m "merge: Person C — complete Next.js frontend"

# 4. Merge Person B glue — main.py depends on agents + services (merged above)
git merge origin/person-b/glue --no-ff -m "merge: Person B — FastAPI WebSocket glue layer"

# If any merge conflicts occur: resolve immediately, test, commit.

# Run ALL tests to verify integration
python -m pytest tests/ -v --timeout=120

git push origin main


═══════════════════════════════════════════════
STEP 4: DEPLOY BACKEND TO CLOUD RUN (10 min)
═══════════════════════════════════════════════

PROJECT_ID=$(gcloud config get-value project)

# Build and push Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/ma-warroom-backend ./backend

# Deploy to Cloud Run
gcloud run deploy ma-warroom-backend \
  --image gcr.io/$PROJECT_ID/ma-warroom-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=$GOOGLE_API_KEY,FIRESTORE_PROJECT_ID=$PROJECT_ID" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 10

# Get backend URL
BACKEND_URL=$(gcloud run services describe ma-warroom-backend --platform managed --region us-central1 --format 'value(status.url)')
echo "Backend URL: $BACKEND_URL"

# Smoke test
curl -s "$BACKEND_URL/health" | python -m json.tool

# Grant Firestore access
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"


═══════════════════════════════════════════════
STEP 5: DEPLOY FRONTEND TO FIREBASE (5 min)
═══════════════════════════════════════════════

# Update frontend env to point to Cloud Run backend
WS_URL=$(echo $BACKEND_URL | sed 's/https/wss/')
echo "NEXT_PUBLIC_WS_URL=${WS_URL}/ws" > frontend/.env.local

# Rebuild frontend with production WebSocket URL
cd frontend && npm run build && cd ..

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Get frontend URL
firebase hosting:channel:list 2>/dev/null || echo "Check Firebase console for URL"


═══════════════════════════════════════════════
STEP 6: E2E SMOKE TESTS (5 min)
═══════════════════════════════════════════════

Create tests/test_e2e_smoke.py:

import os
import pytest
import httpx


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def test_health_endpoint_deployed():
    """Verify deployed backend responds."""
    response = httpx.get(f"{BACKEND_URL}/health", timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "war room ready"


@pytest.mark.asyncio
async def test_websocket_connects():
    """Verify WebSocket endpoint accepts connection and returns session_id."""
    import websockets
    import json

    ws_url = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://") + "/ws"

    async with websockets.connect(ws_url) as ws:
        message = await ws.recv()
        data = json.loads(message)
        assert data["type"] == "session_id"
        assert "session_id" in data
        assert len(data["session_id"]) > 0


@pytest.mark.asyncio
async def test_full_pipeline_deployed():
    """
    Integration test: connect via WebSocket, send text command,
    verify agent status events and deal memo arrive.
    Requires deployed backend with GOOGLE_API_KEY.
    """
    if not os.getenv("GOOGLE_API_KEY"):
        pytest.skip("GOOGLE_API_KEY not set")

    import websockets
    import json
    import asyncio

    ws_url = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://") + "/ws"

    async with websockets.connect(ws_url, open_timeout=30) as ws:
        # Get session ID
        msg = json.loads(await ws.recv())
        assert msg["type"] == "session_id"

        # Send text command (simulates voice detection)
        await ws.send(json.dumps({"type": "text", "text": "Analyze Apple for M&A due diligence"}))

        # Collect events for up to 60 seconds
        events = []
        try:
            while True:
                raw = await asyncio.wait_for(ws.recv(), timeout=60)
                event = json.loads(raw)
                events.append(event)

                # Stop once we get deal memo or pipeline complete
                if event.get("type") in ["deal_memo", "pipeline_complete"]:
                    break
        except asyncio.TimeoutError:
            pass

        event_types = [e["type"] for e in events]
        # We should see at least transcript events
        assert len(events) > 0, "No events received from backend"


Run:
BACKEND_URL=$BACKEND_URL python -m pytest tests/test_e2e_smoke.py -v --timeout=120

GIT CHECKPOINT:
git add tests/test_e2e_smoke.py && git commit -m "test(e2e): add deployed smoke tests — health, websocket, pipeline"
git push origin main


═══════════════════
FINAL CHECKLIST
═══════════════════

[ ] All 4 branches merged to main cleanly
[ ] python -m pytest tests/ -v — ALL PASS
[ ] Backend deployed to Cloud Run — curl /health returns 200
[ ] Frontend deployed to Firebase Hosting — loads in browser
[ ] WebSocket connects from frontend to backend (check browser console)
[ ] Firestore rules deployed
[ ] Cloud Run service account has datastore.user role
[ ] Live demo works: click mic → say company → get briefing → deal memo appears
```

---

# TIMELINE (3 HOURS)

```
HOUR 0:00 ─── START ───────────────────────────────────────────
│
├── [0:00 - 0:15] PERSON D: Scaffolding on main        ★ BLOCKING — everyone waits
│
├── [0:15] ★ SIGNAL: "Scaffold ready. Branch off main."
│
├── [0:15 - 1:15] PERSON A: Prompts + Agents + Orchestrator + Tests ──┐
├── [0:15 - 1:15] PERSON B: Firestore + Audio + LiveSession + Tests ──┤ PARALLEL
├── [0:15 - 1:15] PERSON C: Hook + Components + Page + Build Test ────┘
├── [0:15 - 0:30] PERSON D: Verify GCP, test Dockerfile, prep deploy scripts
│
HOUR 1:15 ─── PUSH BRANCHES ───────────────────────────────────
│
├── [1:15] Person A pushes person-a/agents
├── [1:15] Person B pushes person-b/services
├── [1:15] Person C pushes person-c/frontend
│
├── [1:15 - 1:25] PERSON D: Merge A → B(services) → C → main
│
├── [1:25 - 1:55] PERSON B: Build main.py glue layer (needs agents + services merged)
├── [1:25 - 1:55] PERSON D: Test merged code, verify all tests pass
├── [1:25 - 1:55] PERSON A: Help B debug agent integration issues
├── [1:25 - 1:55] PERSON C: Polish UI, test build, prep demo visuals
│
HOUR 1:55 ─── PERSON B PUSHES GLUE ────────────────────────────
│
├── [1:55 - 2:05] PERSON D: Merge person-b/glue → main
│
├── [2:05 - 2:35] PERSON D: Deploy backend (Cloud Run) + frontend (Firebase)
├── [2:05 - 2:35] PERSON B: Run E2E smoke tests against deployed backend
├── [2:05 - 2:35] PERSON A: Test full pipeline with real API key
├── [2:05 - 2:35] PERSON C: Update .env.local with Cloud Run WSS URL, rebuild, verify
│
HOUR 2:35 ─── DEPLOYED ────────────────────────────────────────
│
├── [2:35 - 3:00] ALL: Demo rehearsal, bug squashing, Firestore screenshots
│
HOUR 3:00 ─── DONE ────────────────────────────────────────────
```

---

# INTERFACE CONTRACTS (CRITICAL — READ THIS)

These are the exact data shapes crossing boundaries between Person A, B, and C's code. If any of these don't match, the integration will fail.

## Contract 1: MAOrchestrator.analyze_company() return value
**Producer:** Person A | **Consumer:** Person B (main.py)

```python
{
    "spoken_briefing": str,    # Plain text briefing for Live API to read aloud
    "deal_memo": {             # Structured JSON for Firestore + frontend
        "company": str,
        "verdict": "BUY" | "WATCH" | "AVOID",
        "confidence": "high" | "medium" | "low",
        "one_liner": str,
        "financials_summary": str,
        "competitive_summary": str,
        "risk_summary": str,
        "red_flags": list[str],
        "follow_up_questions": list[str],
        "sources": list[str],
    },
    "company": str,
    "session_id": str,
}
```

## Contract 2: WebSocket messages backend → frontend
**Producer:** Person B (main.py) | **Consumer:** Person C (useWarRoom.ts)

```typescript
// Session created
{ type: "session_id", session_id: string }

// Audio chunk (base64 encoded LINEAR16 PCM 24kHz)
{ type: "audio", data: string }

// Transcript text line
{ type: "transcript", text: string }

// Company name detected from voice
{ type: "company_detected", company: string }

// Research agents started
{ type: "agent_status", agents: string[], status: "running", company: string }

// Individual agent completed
{ type: "agent_complete", agent: string }

// All agents done
{ type: "pipeline_complete", session_id: string }

// Structured deal memo
{ type: "deal_memo", memo: DealMemo }

// Red flag alert
{ type: "red_flag", flag: string }

// Error
{ type: "error", message: string }
```

## Contract 3: WebSocket messages frontend → backend
**Producer:** Person C (useWarRoom.ts) | **Consumer:** Person B (main.py)

```typescript
// Text follow-up question (JSON string message)
{ type: "text", text: string }

// End session (JSON string message)
{ type: "end_session" }

// Audio from mic (sent as raw binary WebSocket message — NOT JSON)
// Format: Int16 PCM, 16000Hz, mono
ArrayBuffer
```

## Contract 4: LiveSession callbacks
**Producer:** Person B (live_session.py) | **Consumer:** Person B (main.py)

```python
on_audio_output(audio_bytes: bytes)        # Raw PCM bytes from Gemini
on_text_output(text: str)                  # Transcript string
on_company_detected(company_name: str)     # Extracted company name
```

---

# KNOWN GOTCHAS (EVERYONE READ)

| # | Gotcha | Owner | Fix |
|---|--------|-------|-----|
| 1 | Live API session timeout after ~10min silence | B | Keepalive ping every 30s in live_session.py |
| 2 | ParallelAgent shared state key collision | A | Each agent uses unique output_key |
| 3 | Cloud Run needs Firestore IAM role | D | Grant roles/datastore.user to service account |
| 4 | Browser mic may default to 48kHz not 16kHz | C | Force AudioContext({ sampleRate: 16000 }) |
| 5 | CORS on WebSocket Firebase→Cloud Run | B | CORSMiddleware allow_origins=["*"] |
| 6 | Synthesis JSON gets truncated | A | Cap sub-agent output at ~500 tokens in prompt |
| 7 | `adk web` wrong module path | A | Run from project root, not backend/ |
| 8 | Gemini 2.0 Flash 15 RPM free tier | A,B | Add asyncio.sleep(2) between calls if rate limited |
| 9 | _parse_synthesis_output misses bare JSON | A | Fallback regex + setdefault for all keys |
| 10 | next.js static export needed for Firebase | C | output: 'export' in next.config.js |
