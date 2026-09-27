/**
 * Lightweight local intent classifier — no paid API, no external service.
 *
 * This is intentionally simple (token-overlap + keyword/synonym scoring)
 * so the whole project runs on localhost with zero extra infrastructure.
 * It is a drop-in replacement point: swap `scoreIntent` for a call to a
 * Python FastAPI service running sentence-transformers + FAISS later
 * without changing any route code — `classify()` is the only entry point
 * routes depend on.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "my", "i", "to", "of", "in", "on", "for",
  "hai", "ka", "ki", "ke", "mera", "meri", "mujhe", "kya", "aur", "please",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/** score a single intent document against the input utterance */
function scoreIntent(inputTokens, intent) {
  const inputSet = new Set(inputTokens);
  let best = 0;

  for (const q of intent.questions || []) {
    const qSet = new Set(tokenize(q));
    best = Math.max(best, jaccard(inputSet, qSet));
  }

  // synonym / keyword hits give a direct confidence bump —
  // these represent exact-concept matches even with few overlapping tokens
  const bagTerms = [...(intent.synonyms || []), ...(intent.keywords || [])].map((s) => s.toLowerCase());
  let hits = 0;
  for (const term of bagTerms) {
    const termTokens = tokenize(term);
    if (termTokens.every((t) => inputSet.has(t))) hits++;
  }
  const bagScore = bagTerms.length ? Math.min(1, hits / Math.max(1, bagTerms.length) + hits * 0.15) : 0;

  return Math.min(1, best * 0.65 + bagScore * 0.35 + (hits > 0 ? 0.1 : 0));
}

/**
 * classifyLocal(utterance, intents) -> { intent, confidence, ranked }
 * The lightweight, dependency-free scorer — always available, always works.
 */
function classifyLocal(utterance, intents) {
  const inputTokens = tokenize(utterance);
  const ranked = intents
    .map((intent) => ({ intent, confidence: scoreIntent(inputTokens, intent) }))
    .sort((a, b) => b.confidence - a.confidence);

  const top = ranked[0];
  return {
    intent: top ? top.intent : null,
    confidence: top ? +top.confidence.toFixed(3) : 0,
    ranked: ranked.slice(0, 5).map((r) => ({ name: r.intent.name, confidence: +r.confidence.toFixed(3) })),
    source: "local-lexical",
  };
}

/**
 * Tries the optional Python AI microservice (real sentence-transformers
 * embeddings) at AI_SERVICE_URL (default http://localhost:8001). Returns
 * null on any failure (service not running, timeout, bad response) so the
 * caller can fall back — this never throws.
 */
async function tryRemoteClassify(utterance, intents) {
  const baseUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${baseUrl}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        utterance,
        intents: intents.map((i) => ({
          name: i.name,
          questions: i.questions || [],
          synonyms: i.synonyms || [],
          keywords: i.keywords || [],
          confidenceThreshold: i.confidenceThreshold ?? 0.7,
        })),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();

    const matchedDoc = data.matchedIntent ? intents.find((i) => i.name === data.matchedIntent) || null : null;
    return {
      intent: matchedDoc,
      confidence: data.confidence ?? 0,
      ranked: data.ranked || [],
      source: "sentence-transformers",
    };
  } catch (err) {
    return null; // AI microservice not running, timed out, or errored — caller falls back silently
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * classify(utterance, intents) -> { intent, confidence, ranked, source }
 * Public entry point every route calls. Tries the real embeddings-based
 * Python service first; if that's not running (or too slow), falls back to
 * the local lexical scorer automatically. Nothing calling this needs to
 * know or care which one actually answered.
 */
async function classify(utterance, intents) {
  const remote = await tryRemoteClassify(utterance, intents);
  if (remote) return remote;
  return classifyLocal(utterance, intents);
}

module.exports = { classify, classifyLocal, tokenize };
