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
