"""
SRLMS AI microservice — free, local, no API keys.

Three endpoints:
  POST /classify  — real embeddings-based intent matching (sentence-transformers)
  POST /stt       — real speech-to-text on an uploaded audio file (faster-whisper)
  POST /tts       — real text-to-speech, returns a WAV file (piper-tts)

Run:
  pip install -r requirements.txt
  uvicorn main:app --port 8001 --reload

The first request to /classify or /stt will download a model automatically
(from Hugging Face) — that needs a real internet connection on THIS machine
the first time, then everything runs fully offline afterward.
"""

import io
import tempfile
import os
import wave

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

app = FastAPI(title="SRLMS AI Service")

# ---------------------------------------------------------------------------
# Lazy-loaded models — only loaded into memory the first time they're used,
# so `uvicorn main:app` starts up fast even before you've hit any endpoint.
# ---------------------------------------------------------------------------
_embedder = None
_whisper_model = None
_piper_voice = None


def get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        # all-MiniLM-L6-v2: small (~80MB), fast, good enough for intent matching,
        # and works reasonably on Hinglish/code-mixed text too.
        _embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _embedder


def get_whisper():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        # "base" is a good free/fast default; use "small" or "medium" for
        # better accuracy if your machine can handle the extra RAM/time.
        _whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
    return _whisper_model


def get_piper_voice():
    global _piper_voice
    if _piper_voice is None:
        from piper import PiperVoice
        # download a voice model once from https://github.com/rhasspy/piper/releases
        # (or let piper-tts's own downloader fetch it) and point this at the .onnx file.
        model_path = os.environ.get("PIPER_VOICE_PATH", "./voices/en_US-lessac-medium.onnx")
        _piper_voice = PiperVoice.load(model_path)
    return _piper_voice


# ---------------------------------------------------------------------------
# /classify — real sentence-embedding intent matching
# ---------------------------------------------------------------------------
class IntentIn(BaseModel):
    name: str
    questions: list[str] = []
    synonyms: list[str] = []
    keywords: list[str] = []
    confidenceThreshold: float = 0.7


class ClassifyIn(BaseModel):
    utterance: str
    intents: list[IntentIn]


@app.post("/classify")
def classify(payload: ClassifyIn):
    model = get_embedder()

    utterance_emb = model.encode([payload.utterance])[0]

    best_intent = None
    best_score = -1.0
    ranked = []

    import numpy as np

    for intent in payload.intents:
        # combine training questions + synonyms into one bag of reference phrases
        reference_phrases = intent.questions + intent.synonyms
        if not reference_phrases:
            ranked.append({"name": intent.name, "confidence": 0.0})
            continue

        ref_embs = model.encode(reference_phrases)
        # cosine similarity between utterance and every reference phrase; take the best match
        sims = np.dot(ref_embs, utterance_emb) / (
            np.linalg.norm(ref_embs, axis=1) * np.linalg.norm(utterance_emb) + 1e-8
        )
        score = float(np.max(sims))
        ranked.append({"name": intent.name, "confidence": round(score, 3)})

        if score > best_score:
            best_score = score
            best_intent = intent

    ranked.sort(key=lambda r: r["confidence"], reverse=True)

    return {
        "matchedIntent": best_intent.name if best_intent else None,
        "confidence": round(best_score, 3) if best_intent else 0.0,
        "thresholdMet": bool(best_intent) and best_score >= best_intent.confidenceThreshold,
        "ranked": ranked[:5],
    }


# ---------------------------------------------------------------------------
# /stt — real speech-to-text (Whisper)
# ---------------------------------------------------------------------------
@app.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    model = get_whisper()

    with tempfile.NamedTemporaryFile(suffix=os.path.splitext(audio.filename or "audio.wav")[1] or ".wav", delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path, beam_size=5)
        text = " ".join(seg.text.strip() for seg in segments)
        return JSONResponse({"text": text.strip(), "language": info.language, "language_probability": info.language_probability})
    finally:
        os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# /tts — real text-to-speech (Piper), returns a WAV file
# ---------------------------------------------------------------------------
class TtsIn(BaseModel):
    text: str


@app.post("/tts")
def text_to_speech(payload: TtsIn):
    voice = get_piper_voice()
    buffer = io.BytesIO()
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        # piper-tts >=1.6 renamed this to synthesize_wav() and it needs a
        # real wave.Wave_write object (from Python's stdlib wave module) —
        # voice.synthesize() alone just returns raw AudioChunk objects, it
        # doesn't write a file at all, and passing a plain file handle here
        # silently produces an empty WAV instead of raising an error.
        with wave.open(tmp.name, "wb") as wav_file:
            voice.synthesize_wav(payload.text, wav_file)
        tmp.seek(0)
        buffer.write(tmp.read())

    return Response(content=buffer.getvalue(), media_type="audio/wav")


@app.get("/health")
def health():
    return {"ok": True}
