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
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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


@app.get("/")
async def root():
    return {
        "service": "M&A War Room Backend",
        "status": "running",
        "frontend": "http://localhost:5173",
        "ws_endpoint": "ws://localhost:8080/ws",
    }


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
    from live_session import LiveSession
    from agents.orchestrator import MAOrchestrator

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

    try:
        await live_session.start()
    except Exception as e:
        logger.exception("Failed to start Gemini Live session")
        await send_ws({"type": "error", "message": f"Gemini Live API failed: {e}"})
        return

    active_sessions[session_id] = {
        "live_session": live_session,
        "websocket": websocket,
    }

    await send_ws({"type": "session_id", "session_id": session_id})

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break
            if "text" in message:
                data = json.loads(message["text"])
                msg_type = data.get("type")
                if msg_type == "text":
                    await live_session.send_text(data.get("text", ""))
                elif msg_type == "end_session":
                    break
            elif "bytes" in message:
                await live_session.send_audio(message["bytes"])
    except (WebSocketDisconnect, RuntimeError):
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
        deal_memo = await orchestrator.analyze_company(
            company_name=company_name,
            session_id=session_id,
            on_status_update=send_ws,
        )

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
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080)),
        reload=os.getenv("ENVIRONMENT") == "development",
    )
