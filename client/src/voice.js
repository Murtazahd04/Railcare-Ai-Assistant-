/**
 * voice.js — real speech in, real speech out.
 * ----------------------------------------------------------------
 * speak(text)  -> plays audio, resolves when done
 * listen()     -> resolves with the transcribed string
 *
 * Both try the local ai-service first (faster-whisper for STT, piper-tts
 * for TTS, proxied through the Node server at /api/v1/voice/*). If that
 * service isn't running — not started, still downloading its model on
 * first use, or just slow — both fall back automatically to the browser's
 * built-in speechSynthesis / SpeechRecognition, so voice never just stops
 * working because the Python service happens to be down.
 * ---------------------------------------------------------------- */

import { API_BASE } from "./config";

const SpeechRecognitionImpl = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;
export const speechRecognitionSupported = !!SpeechRecognitionImpl || typeof MediaRecorder !== "undefined";

// ---------------------------------------------------------------------
// Speaking (TTS)
// ---------------------------------------------------------------------

function speakWithBrowser(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

/** Real Piper voice via the server. Resolves false (not true/false-throwing) if unavailable, so the caller can fall back. */
async function speakWithServer(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_BASE}/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) return false; // includes the { fallback: true } 503 case
    const blob = await res.blob();
    if (!blob || blob.size < 44) return false; // smaller than a valid WAV header — treat as a failed/empty synth, not silence
    const url = URL.createObjectURL(blob);
    // audio.play() can reject (autoplay policy) or the clip can fail to
    // decode — either way that's a real failure, not "played successfully."
    // Track it explicitly instead of resolving the same way on every path,
    // which previously masked failures and skipped the browser fallback.
    let playedOk = true;
    await new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = resolve;
      audio.onerror = () => { playedOk = false; resolve(); };
      audio.play().catch(() => { playedOk = false; resolve(); });
    });
    URL.revokeObjectURL(url);
    return playedOk;
  } catch {
    return false; // service not running / timed out — caller falls back
  } finally {
    clearTimeout(timeout);
  }
}

export async function speak(text) {
  if (!text) return;
  const played = await speakWithServer(text);
  if (!played) await speakWithBrowser(text);
}

// ---------------------------------------------------------------------
// Listening (STT)
// ---------------------------------------------------------------------

function listenWithBrowser() {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognitionImpl) return reject("not-supported");
    const rec = new SpeechRecognitionImpl();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => resolve(e.results[0][0].transcript);
    rec.onerror = (e) => reject(e.error || "speech-error");
    rec.start();
  });
}

/**
 * Records the mic with a simple volume-based auto-stop: stops ~1.1s after
 * the speaker goes quiet (so it behaves like the native recognizer — no
 * manual stop button needed), with an 8s hard cap as a safety net. Then
 * ships the clip to the server's /voice/stt (faster-whisper).
 */
function recordUntilSilence({ maxMs = 8000, silenceMs = 1100, silenceThreshold = 0.02 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === "undefined") return reject("not-supported");
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const chunks = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      let hasHeardSpeech = false;
      let silenceStartedAt = null;
      const startedAt = Date.now();

      const stopAll = () => {
        clearInterval(vadInterval);
        if (recorder.state !== "inactive") recorder.stop();
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close().catch(() => {});
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        resolve(blob);
      };

      const vadInterval = setInterval(() => {
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        const elapsed = Date.now() - startedAt;

        if (rms > silenceThreshold) {
          hasHeardSpeech = true;
          silenceStartedAt = null;
        } else if (hasHeardSpeech && silenceStartedAt === null) {
          silenceStartedAt = Date.now();
        }

        const silentLongEnough = silenceStartedAt !== null && Date.now() - silenceStartedAt >= silenceMs;
        if ((hasHeardSpeech && silentLongEnough) || elapsed >= maxMs) {
          stopAll();
        }
      }, 100);

      recorder.start();
    }).catch(reject);
  });
}

async function listenWithServer() {
  const blob = await recordUntilSilence(); // rejects (not throws-async) straight to caller's catch if mic/MediaRecorder unavailable
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const form = new FormData();
    form.append("audio", blob, "utterance.webm");
    const res = await fetch(`${API_BASE}/voice/stt`, { method: "POST", body: form, signal: controller.signal });
    if (!res.ok) return null; // { fallback: true } — service unavailable
    const data = await res.json();
    const text = (data.text || "").trim();
    return text || null; // empty transcript (silence-only clip) counts as "try the browser instead"
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * listen() -> Promise<string> — the transcribed utterance.
 * Tries the real Whisper backend first; on any failure (service down,
 * mic permission denied for MediaRecorder, empty transcript) falls back to
 * the browser's native SpeechRecognition where available.
 */
export async function listen() {
  try {
    const text = await listenWithServer();
    if (text) return text;
  } catch {
    // MediaRecorder path unavailable at all — fall through to browser recognizer
  }
  return listenWithBrowser();
}
