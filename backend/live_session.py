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
