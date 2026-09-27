/**
 * Mixes the local mic stream and the remote peer's stream into one track
 * using the Web Audio API, records it with MediaRecorder, and uploads the
 * result to the backend, which stores it in MongoDB via GridFS.
 *
 * Usage:
 *   const recorder = startCallRecording(localStream, remoteStream);
 *   // ... later, when the call ends:
 *   const blob = await recorder.stop();
 *   await uploadRecording(callId, blob, token);
 */

/**
 * Mixes a local stream and a remote stream into one MediaStream using the
 * Web Audio API. Used both for call recording and for feeding a
 * supervisor's "listen in" connection.
 */
export function mixStreams(localStream, remoteStream) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const destination = audioCtx.createMediaStreamDestination();

  if (localStream) {
    audioCtx.createMediaStreamSource(localStream).connect(destination);
  }
  if (remoteStream) {
    audioCtx.createMediaStreamSource(remoteStream).connect(destination);
  }

  return { stream: destination.stream, close: () => audioCtx.close() };
}

export function startCallRecording(localStream, remoteStream) {
  const { stream: mixedStream, close } = mixStreams(localStream, remoteStream);

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const recorder = new MediaRecorder(mixedStream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  return {
    stop() {
      return new Promise((resolve) => {
        recorder.onstop = () => {
          close();
          resolve(new Blob(chunks, { type: mimeType }));
        };
        recorder.stop();
      });
    },
  };
}

import { API_BASE } from "./config";

export async function uploadRecording(callId, blob, token) {
  const form = new FormData();
  form.append("recording", blob, `${callId}.webm`);

  const res = await fetch(`${API_BASE}/calls/${callId}/recording`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error("Failed to upload recording");
  return res.json();
}
