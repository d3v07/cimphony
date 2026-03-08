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
    from live_session import LiveSession

    await websocket.accept()
    session_id = str(uuid.uuid4())

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


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080)),
        reload=os.getenv("ENVIRONMENT") == "development",
    )
