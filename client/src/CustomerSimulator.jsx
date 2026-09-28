import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useCallEngine } from "./useCallEngine";
import { speak, listen as listenOnce, speechRecognitionSupported } from "./voice";
import {
  Phone, PhoneOff, Mic, MicOff, Train, Bot, User, Loader2, Clock, ArrowRight,
  ChevronRight, ChevronDown, ArrowLeft, Star,
} from "lucide-react";

import { SIGNALING_URL, API_BASE } from "./config";



async function aiQuery(utterance, rejectedIntentIds = []) {
  const res = await fetch(`${API_BASE}/public/ai-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ utterance, rejectedIntentIds }),
  });
  return res.json();
}

async function aiQueryConfirm(intentId, pnr) {
  const res = await fetch(`${API_BASE}/public/ai-query/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intentId, pnr: pnr || undefined }),
  });
  return res.json();
}

export default function CustomerSimulator() {
  const [name, setName] = useState("Ramesh Iyer");
  const [pnr, setPnr] = useState("");
  const [session, setSession] = useState(null);
  const socket = useMemo(
    () => (session ? io(SIGNALING_URL, { auth: { token: session.token } }) : null),
    [session]
  );
  const engine = useCallEngine({ socket, role: "customer", name: session?.user?.name || name });

  const [faqTopics, setFaqTopics] = useState([]);
  const [customQuery, setCustomQuery] = useState("");
  const [aiPhase, setAiPhase] = useState("topic-select");
  const [transcript, setTranscript] = useState([]);
  const [textFallback, setTextFallback] = useState("");
  const [aiError, setAiError] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState(null); // { id, name, utterance, rejected }
  const [clarifyOptions, setClarifyOptions] = useState(null); // { options: [{id,name,sampleQuestion}], utterance, rejected }
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [callRating, setCallRating] = useState(null); // stars submitted for the just-ended real call
  const [callRatingSubmitting, setCallRatingSubmitting] = useState(false);
  const transcriptRef = useRef([]);
  const lastResultRef = useRef(null);
  const pendingFirstQuery = useRef(null);
  const pendingFirstIntentId = useRef(null); // set when the customer picked a specific issue from the category list
  const [selectedCategory, setSelectedCategory] = useState(null); // Swiggy-style: category list -> issue list -> chat

  useEffect(() => {
    fetch(`${API_BASE}/public/faq`).then((r) => r.json()).then(setFaqTopics).catch(() => {});
  }, []);

  function pushTranscript(speaker, text) {
    transcriptRef.current = [...transcriptRef.current, { speaker, text }];
    setTranscript(transcriptRef.current);
  }

  async function connectAndGreet() {
    setAiError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/customer-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setSession(data);
    } catch {
      setSession({ token: null, user: { name } });
    }
  }

  useEffect(() => {
    if (session && aiPhase === "topic-select-done-waiting") {
      if (pendingFirstIntentId.current) {
        const intentId = pendingFirstIntentId.current;
        const label = pendingFirstQuery.current;
        pendingFirstIntentId.current = null;
        runAiTurnDirect(intentId, label);
      } else {
        runAiTurn(pendingFirstQuery.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleStartWithTopic(topicName) {
    pendingFirstQuery.current = topicName;
    setAiPhase("topic-select-done-waiting");
    await connectAndGreet();
  }

  /** Swiggy-style: customer already picked the exact issue from the category list — skip free text/voice, answer it directly. */
  async function handleStartWithIssue(intentId, issueName) {
    pendingFirstIntentId.current = intentId;
    pendingFirstQuery.current = issueName;
    setAiPhase("topic-select-done-waiting");
    await connectAndGreet();
  }

  /** Customer taps the mic on the very first screen — skips topic-picking, AI greets then listens. */
  async function handleStartWithVoice() {
    pendingFirstQuery.current = null;
    setAiPhase("topic-select-done-waiting");
    await connectAndGreet();
  }

  async function handleStartWithCustomQuery() {
    if (!customQuery.trim()) return;
    pendingFirstQuery.current = customQuery.trim();
    setAiPhase("topic-select-done-waiting");
    await connectAndGreet();
  }

  async function handleSkipToHuman() {
    pendingFirstQuery.current = "__skip__";
    setAiPhase("topic-select-done-waiting");
    await connectAndGreet();
  }

  async function runAiTurnDirect(intentId, issueName) {
    setAiPhase("greeting");
    await speak(`Welcome to Indian Railways linen support, ${name}. Let me check that for you.`);
    pushTranscript("customer", issueName);
    setAiPhase("thinking");
    setRelatedQuestions([]);
    const data = await aiQueryConfirm(intentId, pnr);
    lastResultRef.current = { matchedIntent: data.matchedIntent, confidence: 1, thresholdMet: true };
    pushTranscript("ai", data.reply);
    setRelatedQuestions(data.relatedQuestions || []);
    setAiPhase("speaking");
    await speak(data.reply);
    setAiPhase("resolved");
  }

  async function runAiTurn(initialQuery) {
    setAiPhase("greeting");
    await speak(`Welcome to Indian Railways linen support, ${name}. How can I help you today?`);

    if (initialQuery === "__skip__") {
      await transferToHuman();
      return;
    }

    let queryText = initialQuery;
    if (!queryText) {
      queryText = await captureQuery();
      if (!queryText) return;
    }
    pushTranscript("customer", queryText);
    await processQuery(queryText);
  }

  async function captureQuery() {
    setAiPhase("listening");
    setAiError(null);
    if (speechRecognitionSupported) {
      try {
        return await listenOnce();
      } catch (err) {
        setAiError("Didn't catch that — you can type it below instead.");
        return null;
      }
    }
    return null;
  }

  async function processQuery(queryText, rejectedIntentIds = []) {
    setAiPhase("thinking");
    setRelatedQuestions([]);
    setClarifyOptions(null);
    const result = await aiQuery(queryText, rejectedIntentIds);
    lastResultRef.current = result;

    if (result.status === "confirm") {
      setPendingConfirm({
        id: result.candidateIntentId,
        name: result.candidateIntentName,
        utterance: queryText,
        rejected: rejectedIntentIds,
      });
      pushTranscript("ai", result.confirmPrompt);
      setAiPhase("confirming");
      await speak(result.confirmPrompt);
    } else if (result.status === "clarify") {
      // Not confident enough for a single guess, but there are plausible
      // candidates — ask before giving up and routing to a human.
      setClarifyOptions({ options: result.options, utterance: queryText, rejected: rejectedIntentIds });
      const prompt = "I'm not fully sure, but did you mean one of these?";
      pushTranscript("ai", prompt);
      setAiPhase("clarifying");
      await speak(prompt);
    } else {
      pushTranscript("ai", "I couldn't find anything close to that in what I know.");
      await transferToHuman();
    }
  }

  async function handleClarifyPick(option) {
    setClarifyOptions(null);
    pushTranscript("customer", option.sampleQuestion || option.name);
    setAiPhase("thinking");
    const data = await aiQueryConfirm(option.id, pnr);
    lastResultRef.current = { matchedIntent: data.matchedIntent, confidence: 1, thresholdMet: true };
    pushTranscript("ai", data.reply);
    setRelatedQuestions(data.relatedQuestions || []);
    setAiPhase("speaking");
    await speak(data.reply);
    setAiPhase("resolved");
  }

  async function handleClarifyNone() {
    const current = clarifyOptions;
    setClarifyOptions(null);
    pushTranscript("customer", "None of these");
    if (current) {
      const rejectedIds = [...current.rejected, ...current.options.map((o) => o.id)];
      await processQuery(current.utterance, rejectedIds);
    } else {
      await transferToHuman();
    }
  }

  async function handleConfirmYes() {
    const candidate = pendingConfirm;
    if (!candidate) return;
    setPendingConfirm(null);
    setAiPhase("thinking");
    const data = await aiQueryConfirm(candidate.id, pnr);
    lastResultRef.current = { matchedIntent: data.matchedIntent, confidence: 1, thresholdMet: true };
    pushTranscript("ai", data.reply);
    setRelatedQuestions(data.relatedQuestions || []);
    setAiPhase("speaking");
    await speak(data.reply);
    setAiPhase("resolved");
  }

  async function handleConfirmNo() {
    const candidate = pendingConfirm;
    if (!candidate) return;
    setPendingConfirm(null);
    pushTranscript("customer", "No, that's not it");
    await processQuery(candidate.utterance, [...candidate.rejected, candidate.id]);
  }

  async function handleRelatedQuestion(sampleQuestion) {
    pushTranscript("customer", sampleQuestion);
    await processQuery(sampleQuestion);
  }

  async function transferToHuman() {
    setCallRating(null);
    setAiPhase("transferring");
    await speak("I'll connect you to an executive now.");
    engine.placeCall({
      topic: pendingFirstQuery.current === "__skip__" ? null : pendingFirstQuery.current,
      pnr: pnr || null,
      transcript: transcriptRef.current,
      aiIntent: lastResultRef.current?.matchedIntent || null,
      aiConfidence: lastResultRef.current?.confidence ?? null,
    });
  }

  async function handleAskAnother() {
    const queryText = await captureQuery();
    if (queryText) {
      pushTranscript("customer", queryText);
      await processQuery(queryText);
    }
  }

  async function handleRateCall(stars) {
    if (!engine.callId || callRatingSubmitting) return;
    setCallRatingSubmitting(true);
    try {
      await fetch(`${API_BASE}/public/calls/${engine.callId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars }),
      });
      setCallRating(stars);
    } catch {
      // non-critical — the executive's own dashboard still shows the call either way
    } finally {
      setCallRatingSubmitting(false);
    }
  }

  function handleTextFallbackSubmit(e) {
    e.preventDefault();
    if (!textFallback.trim()) return;
    const text = textFallback.trim();
    setTextFallback("");
    pushTranscript("customer", text);
    processQuery(text);
  }

  const isQueued = engine.status === "queued";
  const inRealCall = engine.status !== "idle" && !isQueued;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-screen bg-[#F4F6FA] text-[#0F172A] flex items-center justify-center p-3 sm:p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-md rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Train size={18} className="text-[#0284C7]" />
          <div>
            <div className="text-sm font-semibold">SRLMS · Passenger Helpline</div>
            <div className="text-[11px] text-[#64748B]">AI assistant first, real executive if needed</div>
          </div>
        </div>

        {aiPhase === "topic-select" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#64748B]">Your name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82C4]/50" />
            </div>
            <div>
              <label className="text-xs text-[#64748B]">PNR (optional, helps the executive if you're transferred)</label>
              <input value={pnr} onChange={(e) => setPnr(e.target.value)}
                className="w-full mt-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82C4]/50" />
            </div>

            <div>
              <div className="text-xs text-[#64748B] mb-2">
                {selectedCategory ? (
                  <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 text-[#0284C7] hover:text-[#0369A1]">
                    <ArrowLeft size={12} /> Back to categories
                  </button>
                ) : (
                  "What's this about? Pick a category…"
                )}
              </div>

              {!selectedCategory && (
                <div className="rounded-md border border-[#E2E8F0] overflow-hidden">
                  {[...new Set(faqTopics.map((f) => f.category))].map((cat, idx) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left hover:bg-[#FFFFFF] ${idx > 0 ? "border-t border-[#E2E8F0]" : ""}`}>
                      <span className="text-[#0F172A]">{cat}</span>
                      <ChevronRight size={14} className="text-[#64748B]" />
                    </button>
                  ))}
                </div>
              )}

              {selectedCategory && (
                <div className="rounded-md border border-[#E2E8F0] overflow-hidden">
                  {faqTopics.filter((f) => f.category === selectedCategory).map((f, idx) => (
                    <IssueAccordionRow key={f.id} intent={f} isFirst={idx === 0} onChat={() => handleStartWithIssue(f.id, f.name)} />
                  ))}
                </div>
              )}
            </div>

            {speechRecognitionSupported && (
              <button onClick={handleStartWithVoice}
                className="w-full py-3 rounded-md bg-[#2FBF71]/15 border border-[#2FBF71]/40 text-[#2FBF71] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2FBF71]/25">
                <Mic size={16} /> Tap to speak instead
              </button>
            )}

            <div className="flex gap-2">
              <input value={customQuery} onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Or describe your issue…"
                className="flex-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none" />
              <button onClick={handleStartWithCustomQuery}
                className="px-3 py-2 rounded-md bg-[#2FBF71]/15 border border-[#2FBF71]/40 text-[#2FBF71] text-xs font-medium flex items-center gap-1">
                <Phone size={13} /> Start
              </button>
            </div>

            <button onClick={handleSkipToHuman} className="w-full text-[11px] text-[#64748B] hover:text-[#64748B] underline underline-offset-2">
              Skip the AI, connect me to a human directly
            </button>
          </div>
        )}

        {aiPhase !== "topic-select" && !inRealCall && (
          <div className="space-y-4">
            <div className="rounded-md border border-[#E2E8F0] bg-[#FFFFFF] p-3 space-y-2 max-h-64 overflow-y-auto">
              {transcript.map((t, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs ${t.speaker === "ai" ? "" : "flex-row-reverse text-right"}`}>
                  {t.speaker === "ai"
                    ? <Bot size={13} className="text-[#0284C7] mt-0.5 shrink-0" />
                    : <User size={13} className="text-[#64748B] mt-0.5 shrink-0" />}
                  <span className={t.speaker === "ai" ? "text-[#0284C7]" : "text-[#475569]"}>{t.text}</span>
                </div>
              ))}
              {transcript.length === 0 && <div className="text-[11px] text-[#64748B]">Conversation will appear here…</div>}
            </div>

            {(aiPhase === "greeting" || aiPhase === "speaking") && (
              <div className="flex items-center gap-2 text-xs text-[#0284C7] justify-center py-2">
                <Bot size={14} className="animate-pulse" /> AI is speaking…
              </div>
            )}
            {aiPhase === "listening" && speechRecognitionSupported && (
              <div className="flex items-center gap-2 text-xs text-[#2FBF71] justify-center py-2">
                <Mic size={14} className="animate-pulse" /> Listening…
              </div>
            )}
            {aiPhase === "thinking" && (
              <div className="flex items-center gap-2 text-xs text-[#F5A623] justify-center py-2">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            )}
            {aiPhase === "clarifying" && clarifyOptions && (
              <div className="space-y-2">
                {clarifyOptions.options.map((opt) => (
                  <button key={opt.id} onClick={() => handleClarifyPick(opt)}
                    className="w-full text-left px-3 py-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs text-[#475569] hover:bg-[#FFFFFF]">
                    {opt.name}
                    {opt.sampleQuestion && <div className="text-[10px] text-[#64748B] mt-0.5">"{opt.sampleQuestion}"</div>}
                  </button>
                ))}
                <button onClick={handleClarifyNone}
                  className="w-full py-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs text-[#64748B]">
                  None of these
                </button>
              </div>
            )}

            {aiPhase === "confirming" && pendingConfirm && (
              <div className="flex gap-2">
                <button onClick={handleConfirmYes} className="flex-1 py-2 rounded-md bg-[#2FBF71]/15 border border-[#2FBF71]/40 text-[#2FBF71] text-xs font-medium">
                  Yes, that's it
                </button>
                <button onClick={handleConfirmNo} className="flex-1 py-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs">
                  No, something else
                </button>
              </div>
            )}
            {aiPhase === "transferring" && (
              <div className="flex items-center gap-2 text-xs text-[#F5A623] justify-center py-2">
                <Clock size={14} className="animate-pulse" /> Connecting you to an executive · ~2 min wait
              </div>
            )}

            {aiError && (
              <div className="space-y-2 text-center">
                <div className="text-[11px] text-[#E5484D]">{aiError}</div>
                {speechRecognitionSupported && aiPhase === "listening" && (
                  <button onClick={handleAskAnother}
                    className="mx-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border border-[#2FBF71]/40 bg-[#2FBF71]/10 text-[#2FBF71]">
                    <Mic size={12} /> Tap to try again
                  </button>
                )}
              </div>
            )}

            {((aiPhase === "listening") || aiPhase === "resolved") && (
              <form onSubmit={handleTextFallbackSubmit} className="flex gap-2">
                <input
                  value={textFallback}
                  onChange={(e) => setTextFallback(e.target.value)}
                  placeholder="Type your question…"
                  className="flex-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none"
                />
                <button type="submit" className="px-3 py-2 rounded-md bg-[#2FBF71]/15 border border-[#2FBF71]/40 text-[#2FBF71] text-xs font-medium">Send</button>
                {speechRecognitionSupported && (
                  <button type="button" onClick={handleAskAnother}
                    className="px-3 py-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs" title="Speak instead">
                    <Mic size={14} />
                  </button>
                )}
              </form>
            )}

            {aiPhase === "resolved" && (
              <div className="space-y-2">
                {relatedQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-[#64748B]">Related questions</div>
                    <div className="flex flex-wrap gap-1.5">
                      {relatedQuestions.map((r) => (
                        <button key={r.id} onClick={() => handleRelatedQuestion(r.sampleQuestion)}
                          className="px-2.5 py-1.5 rounded-full text-[11px] border border-[#3B82C4]/30 bg-[#3B82C4]/10 text-[#0284C7] hover:bg-[#3B82C4]/20">
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleAskAnother} className="flex-1 py-2 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs flex items-center justify-center gap-1">
                    {speechRecognitionSupported && <Mic size={12} />} Ask something else
                  </button>
                  <button onClick={transferToHuman} className="flex-1 py-2 rounded-md bg-[#3B82C4]/15 border border-[#3B82C4]/40 text-[#0284C7] text-xs flex items-center justify-center gap-1">
                    Talk to a human <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isQueued && (
          <div className="space-y-3 text-center py-4">
            <div className="flex items-center gap-2 text-sm text-[#F5A623] justify-center animate-pulse">
              <Clock size={16} /> All executives are busy right now
            </div>
            <div className="text-xs text-[#64748B]">
              You're <span className="text-[#0F172A] font-semibold">#{engine.queueInfo?.position ?? "…"}</span> in
              line · estimated wait{" "}
              <span className="text-[#0F172A] font-semibold">
                ~{Math.max(1, Math.round((engine.queueInfo?.estimatedWaitSec || 0) / 60))} min
              </span>
            </div>
            <button onClick={engine.cancelQueue} className="text-[11px] text-[#64748B] hover:text-[#64748B] underline underline-offset-2">
              Cancel and hang up
            </button>
          </div>
        )}

        {inRealCall && (
          <div className="space-y-4">
            <div className="text-xs text-[#64748B]">
              Status: <span className="text-[#0F172A] font-mono">{engine.status}</span>
              {engine.peerName && <> · with <span className="text-[#0284C7]">{engine.peerName}</span></>}
            </div>

            {engine.error && (
              <div className="text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-md px-3 py-2">{engine.error}</div>
            )}

            <audio ref={engine.remoteAudioRef} autoPlay />

            {(engine.status === "ringing-out" || engine.status === "transferring") && (
              <div className="text-center text-sm text-[#F5A623] py-3 animate-pulse">
                {engine.status === "transferring" ? "Being transferred…" : "Ringing an executive…"}
              </div>
            )}

            {engine.status === "connected" && (
              <div className="flex gap-2">
                <button onClick={engine.toggleMute} className="flex-1 py-2.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs flex items-center justify-center gap-1.5">
                  {engine.muted ? <MicOff size={14} /> : <Mic size={14} />} {engine.muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={engine.endCall} className="flex-1 py-2.5 rounded-md bg-[#E5484D]/10 border border-[#E5484D]/30 text-[#E5484D] text-xs flex items-center justify-center gap-1.5">
                  <PhoneOff size={14} /> Hang Up
                </button>
              </div>
            )}

            {engine.status === "ended" && (
              <div className="text-center text-sm text-[#64748B] py-3 space-y-2">
                <div>Call ended.</div>
                {callRating ? (
                  <div className="flex items-center justify-center gap-1 text-[#F5A623]">
                    {Array.from({ length: callRating }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    <span className="text-xs text-[#64748B] ml-1">Thanks for the feedback</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs text-[#64748B]">How was this call?</div>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => handleRateCall(n)} disabled={callRatingSubmitting}
                          className="text-[#F5A623] hover:scale-110 transition-transform disabled:opacity-50">
                          <Star size={20} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** One expandable issue row, Swiggy-Help&Support style: tap to expand a preview, then "Chat with AI" to get a direct answer. */
function IssueAccordionRow({ intent, isFirst, onChat }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={isFirst ? "" : "border-t border-[#E2E8F0]"}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-left hover:bg-[#FFFFFF]">
        <span className="text-[#0F172A]">{intent.name}</span>
        <ChevronDown size={14} className={`text-[#64748B] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {intent.questions?.[0] && (
            <div className="text-[11px] text-[#64748B]">e.g. "{intent.questions[0]}"</div>
          )}
          <button onClick={onChat}
            className="px-3 py-2 rounded-md bg-[#2FBF71]/15 border border-[#2FBF71]/40 text-[#2FBF71] text-[11px] font-medium">
            Chat with AI
          </button>
        </div>
      )}
    </div>
  );
}
