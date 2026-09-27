/**
 * Voice proxy — real speech-to-text (faster-whisper) and text-to-speech
 * (piper-tts), both served by the optional Python ai-service at
 * AI_SERVICE_URL (default http://localhost:8001).
 *
 * Same philosophy as utils/classifier.js: never throw. If the ai-service
 * isn't running (or is still downloading a model on first use, or just
 * times out), respond with a 503 + { fallback: true } instead of a hard
 * error, so the client can drop back to the browser's built-in
 * speechSynthesis/SpeechRecognition without the call flow ever breaking.
 */

const express = require("express");
const multer = require("multer");
const { placeCallback } = require("../utils/twilioCall");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB cap per utterance

function aiServiceUrl() {
  return process.env.AI_SERVICE_URL || "http://localhost:8001";
}

// STT can take longer than a normal classify call (model has to run over
// several seconds of audio), so it gets its own, longer timeout than the
// 2s used for /classify.
const STT_TIMEOUT_MS = 15000;
const TTS_TIMEOUT_MS = 10000;

/**
 * POST /api/v1/voice/stt
 * multipart/form-data, field name "audio" — any format the browser's
 * MediaRecorder produced (webm/ogg/wav all work, faster-whisper/ffmpeg
 * handle the decode). Returns { text, language, language_probability }.
 */
router.post("/stt", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STT_TIMEOUT_MS);
  try {
    const form = new FormData();
    form.append("audio", new Blob([req.file.buffer]), req.file.originalname || "audio.webm");

    const upstream = await fetch(`${aiServiceUrl()}/stt`, { method: "POST", body: form, signal: controller.signal });
    if (!upstream.ok) return res.status(503).json({ fallback: true, error: "ai-service /stt returned an error" });

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    // ai-service not running, model still loading, or timed out — the
    // client should silently fall back to the browser's own recognizer.
    res.status(503).json({ fallback: true, error: "Speech-to-text service unavailable" });
  } finally {
    clearTimeout(timeout);
  }
});

/**
 * POST /api/v1/voice/tts
 * JSON body { text }. Streams back a WAV file on success; on failure
 * returns JSON { fallback: true } so the client knows to use
 * window.speechSynthesis instead.
 */
router.post("/tts", express.json(), async (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "No text provided" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
  try {
    const upstream = await fetch(`${aiServiceUrl()}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!upstream.ok) return res.status(503).json({ fallback: true, error: "ai-service /tts returned an error" });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.set("Content-Type", "audio/wav");
    res.send(buffer);
  } catch (err) {
    res.status(503).json({ fallback: true, error: "Text-to-speech service unavailable" });
  } finally {
    clearTimeout(timeout);
  }
});

/**
 * POST /api/v1/voice/callback-request
 * JSON body { mobile, passengerName? }. Places a real outbound phone call
 * to the passenger's mobile via Twilio, bridging to the executive fallback
 * number — used when the in-app call couldn't connect (queue exhausted).
 * Always responds 200 with { ok, reason? } rather than a hard error status,
 * since "Twilio isn't configured yet" / "number not verified" are expected,
 * recoverable states the client should show as a friendly message, not a
 * failed request.
 */
router.post("/callback-request", express.json(), async (req, res) => {
  const mobile = (req.body?.mobile || "").trim();
  if (!mobile) return res.status(400).json({ ok: false, reason: "No mobile number provided" });

  const name = (req.body?.passengerName || "").trim();
  const announcement = name
    ? `Hi ${name}, this is Indian Railways passenger support, returning your call. Connecting you now.`
    : undefined;

  const result = await placeCallback(mobile, { announcement });
  res.json(result);
});

module.exports = router;
