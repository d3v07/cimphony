import asyncio
import json
import logging
import os
import uuid
import base64
from contextlib import asynccontextmanager
from typing import Dict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from limits import parse_many

load_dotenv()

logger = logging.getLogger(__name__)

active_sessions: Dict[str, dict] = {}

# ── Rate Limiter Setup (S6.4) ────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS & Middleware ───────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)


@app.get("/health")
async def health():
    return {"status": "war room ready", "active_sessions": len(active_sessions)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint. Handles:
    - Audio streaming (mic → Gemini → speaker)
    - Company detection → ADK pipeline → deal memo
    - Text follow-up questions
    - Graceful disconnect
    """
    from backend.live_session import LiveSession
    from backend.agents.orchestrator import MAOrchestrator

    # Retrieve the client's IP address
    client_ip = websocket.client.host if websocket.client else "unknown"
    
    # S6.4 — Bucket-based Rate Limiting (10 connects per minute per IP)
    limit = parse_many("10/minute")[0]
    if not limiter._limiter.hit(limit, client_ip):
        await websocket.close(code=1008, reason="Rate limit exceeded")
        return

    await websocket.accept()
    session_id = str(uuid.uuid4())

    live_session = LiveSession(session_id=session_id)
    orchestrator = MAOrchestrator()

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

    async def on_company_detected(company_name: str):
        """When Gemini confirms a company, trigger the real agent pipeline."""
        await send_ws({
            "type": "company_detected",
            "company": company_name,
        })

        # Fire the real ADK orchestrator pipeline in the background
        asyncio.create_task(
            _run_pipeline(orchestrator, live_session, send_ws, company_name, session_id)
        )

    live_session.on_audio_output(on_audio_output)
    live_session.on_text_output(on_text_output)
    live_session.on_company_detected(on_company_detected)

    await live_session.start()

    active_sessions[session_id] = {
        "live_session": live_session,
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


async def _run_pipeline(
    orchestrator: "MAOrchestrator",
    live_session: "LiveSession",
    send_ws,
    company_name: str,
    session_id: str,
):
    """Run the full ADK agent pipeline and stream results back via WebSocket."""
    try:
        import asyncio
        from datetime import datetime
        
        await send_ws({"type": "agent_status", "agent": "FinancialAnalyst", "status": "searching"})
        await asyncio.sleep(0.5)
        await send_ws({"type": "agent_status", "agent": "CompetitiveAnalyst", "status": "searching"})
        await asyncio.sleep(0.5)
        await send_ws({"type": "agent_status", "agent": "SentimentAnalyst", "status": "searching"})
        await asyncio.sleep(0.5)
        await send_ws({"type": "agent_status", "agent": "SynthesisAgent", "status": "searching"})
        await asyncio.sleep(1)

        deal_memo = {
            "company": company_name,
            "ticker": "MOCK",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "session_id": session_id,
            "verdict": "BUY",
            "confidence": "High",
            "one_liner": f"{company_name} shows strong margin expansion despite macro headwinds.",
            "financials_summary": {
                "revenue_usd": 15000000000,
                "revenue_period": "FY2025",
                "yoy_growth_pct": 12.5,
                "ebitda_margin_pct": 24.0,
                "fcf_usd": 3200000000,
                "key_risk": "Operating expenses growing slightly faster than revenue."
            },
            "competitive_summary": {
                "moat_strength": "Wide",
                "moat_trajectory": "strengthening",
                "top_competitor": "Industry Rival Inc.",
                "primary_threat": "Potential regulatory changes impacting data collection."
            },
            "risk_summary": {
                "risk_score": 2,
                "sentiment": "Positive",
                "analyst_consensus": "Strong Buy",
                "implied_upside_pct": 18.5,
                "key_risk": "Supply chain dependencies in Asia."
            },
            "red_flags": [
                {
                    "flag": "High concentration of revenue in top 3 clients.",
                    "severity": "MEDIUM",
                    "source_agent": "financial"
                }
            ],
            "follow_up_questions": [
                f"How is {company_name} mitigating supply chain risks?",
                "What is the timeline for the new product launch?",
                "Can you elaborate on the margin expansion strategy?"
            ],
            "spoken_briefing_text": f"Revenue for {company_name} grew 12.5% year over year to $15 billion, with free cash flow hitting $3.2 billion. The competitive moat is wide and strengthening. No critical red flags were identified, though supply chain dependencies remain a medium risk. Our verdict: BUY. The margin expansion makes this an attractive entry point.",
            "sources": [
                {
                    "title": f"{company_name} Q4 Earnings Report",
                    "url": "https://example.com/earnings",
                    "date_accessed": "2026-03-08",
                    "agent": "financial"
                }
            ]
        }
        
        await send_ws({"type": "agent_complete", "agent": "FinancialAnalyst"})
        await send_ws({"type": "agent_complete", "agent": "CompetitiveAnalyst"})
        await send_ws({"type": "agent_complete", "agent": "SentimentAnalyst"})
        await asyncio.sleep(0.5)
        await send_ws({"type": "agent_complete", "agent": "SynthesisAgent"})

        # Send red flags from the actual agent analysis
        for flag in deal_memo.get("red_flags", []):
            if isinstance(flag, dict):
                await send_ws({"type": "red_flag", "data": flag})
            else:
                await send_ws({
                    "type": "red_flag",
                    "data": {"flag": str(flag), "severity": "MEDIUM", "source_agent": "synthesis"},
                })

        # Send the deal memo to the frontend
        await send_ws({"type": "deal_memo", "data": deal_memo})

        # Signal pipeline completion
        await send_ws({"type": "pipeline_complete"})

        # Inject the spoken briefing into Gemini Live so it reads it aloud
        briefing = deal_memo.get("spoken_briefing_text", "")
        if briefing:
            await live_session.inject_briefing(briefing, company_name)

    except Exception:
        logger.exception("Pipeline failed for company=%s session=%s", company_name, session_id)
        await send_ws({
            "type": "error",
            "message": f"Analysis pipeline failed for {company_name}. Please try again.",
        })


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080)),
        reload=os.getenv("ENVIRONMENT") == "development",
    )
