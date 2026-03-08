"""
Unit tests for backend audio utilities (Issue #51 / S2.5).

Tests PCM to WAV header generation and raw audio chunking.
"""

import pytest

from backend.services.audio_utils import (
    pcm_to_wav_header,
    chunk_audio,
    convert_browser_audio_to_pcm,
)


class TestAudioUtils:
    """Test suite for audio processing utilities."""

    def test_chunk_audio_correct_size(self):
        """
        Verify that 1 second of 16kHz 16-bit mono audio (32,000 bytes)
        splits perfectly into 10 chunks of 100ms (3,200 bytes each).
        """
        # 16000 samples/sec * 2 bytes/sample * 1 channel * 1 second = 32000 bytes
        one_second_audio = b"\x00" * 32000

        chunks = chunk_audio(one_second_audio, chunk_size_ms=100, sample_rate=16000)

        assert len(chunks) == 10
        for chunk in chunks:
            assert len(chunk) == 3200

    def test_wav_header_length(self):
        """Verify the generated WAV header is exactly 44 bytes long."""
        header = pcm_to_wav_header(sample_rate=16000, channels=1, bits=16)
        assert len(header) == 44

    def test_wav_header_starts_with_riff(self):
        """Verify the generated WAV header starts with the RIFF magic bytes."""
        header = pcm_to_wav_header(sample_rate=16000, channels=1, bits=16)
        assert header[:4] == b"RIFF"
        assert header[8:12] == b"WAVE"

    def test_browser_audio_passthrough(self):
        """
        Verify convert_browser_audio_to_pcm acts as a passthrough
        for raw PCM bytes (the current implementation of the project).
        """
        test_data = b"\x01\x02\x03\x04\x05"
        result = convert_browser_audio_to_pcm(test_data)
        assert result == test_data

