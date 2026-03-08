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
