import asyncio
import logging
import os
import re
from typing import Optional, Callable
from google import genai
from google.genai import types as genai_types

logger = logging.getLogger(__name__)


class LiveSession:
    LIVE_MODEL = "gemini-2.5-flash-native-audio-latest"

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
        self._session_cm = None  # async context manager from connect()
        self._company_detected_callback: Optional[Callable] = None
        self._audio_output_callback: Optional[Callable] = None
        self._text_output_callback: Optional[Callable] = None
        self._receive_task: Optional[asyncio.Task] = None
        self._detected_companies: set[str] = set()  # debounce

    def on_company_detected(self, callback: Callable):
        self._company_detected_callback = callback

    def on_audio_output(self, callback: Callable):
        self._audio_output_callback = callback

    def on_text_output(self, callback: Callable):
        self._text_output_callback = callback

    async def start(self):
        config = genai_types.LiveConnectConfig(
            response_modalities=["AUDIO"],
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

        self._session_cm = self.client.aio.live.connect(
            model=self.LIVE_MODEL,
            config=config,
        )
        self._session = await self._session_cm.__aenter__()

        self._receive_task = asyncio.create_task(self._receive_loop())

    async def send_audio(self, audio_chunk: bytes):
        if self._session:
            await self._session.send_realtime_input(
                media=genai_types.Blob(
                    data=audio_chunk,
                    mime_type="audio/pcm;rate=16000",
                ),
            )

    async def inject_briefing(self, briefing_text: str, company: str):
        """Send synthesis briefing to Live API so it reads it aloud."""
        if self._session:
            injection = (
                f"The research team has completed their analysis of {company}. "
                f"Deliver the following briefing:\n\n{briefing_text}"
            )
            await self._session.send_client_content(
                turns=genai_types.Content(
                    role="user",
                    parts=[genai_types.Part(text=injection)],
                ),
                turn_complete=True,
            )

    async def send_text(self, text: str):
        if self._session:
            await self._session.send_client_content(
                turns=genai_types.Content(
                    role="user",
                    parts=[genai_types.Part(text=text)],
                ),
                turn_complete=True,
            )

    async def _receive_loop(self):
        if not self._session:
            return
        try:
            async for response in self._session.receive():
                sc = response.server_content
                if sc is None:
                    continue

                # Extract audio and text from model_turn parts
                if sc.model_turn and sc.model_turn.parts:
                    for part in sc.model_turn.parts:
                        # Audio data lives in inline_data
                        if part.inline_data and part.inline_data.data:
                            if self._audio_output_callback:
                                await self._audio_output_callback(part.inline_data.data)

                        # Text lives in part.text
                        if part.text:
                            if self._text_output_callback:
                                await self._text_output_callback(part.text)
                            await self._check_for_company_intent(part.text)

                # Also check output_transcription for text we might have missed
                if sc.output_transcription and sc.output_transcription.text:
                    txt = sc.output_transcription.text
                    if self._text_output_callback:
                        await self._text_output_callback(txt)
                    await self._check_for_company_intent(txt)

        except asyncio.CancelledError:
            pass
        except Exception:
            logger.exception("Live API receive loop error (session=%s)", self.session_id)

    async def _check_for_company_intent(self, text: str):
        """Detect company name from Live API's confirmation text (with debounce)."""
        pattern = r"[Aa]nalyzing\s+([A-Z][A-Za-z\s&'.]+?)(?:\.|,|\s+[Ss]pinning|\s+[Ll]et)"
        match = re.search(pattern, text)
        if match and self._company_detected_callback:
            company_name = match.group(1).strip()
            # Debounce: only fire once per company per session
            key = company_name.lower()
            if key in self._detected_companies:
                return
            self._detected_companies.add(key)
            try:
                await self._company_detected_callback(company_name)
            except Exception:
                logger.exception("Company detected callback failed for '%s'", company_name)

    async def close(self):
        if self._receive_task:
            self._receive_task.cancel()
            self._receive_task = None
        if self._session_cm:
            try:
                await self._session_cm.__aexit__(None, None, None)
            except Exception:
                pass
            self._session_cm = None
            self._session = None
