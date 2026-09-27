/**
 * Lightweight heuristic sentiment/urgency scorer.
 *
 * Not ML — just keyword + tone signals, which is plenty for "should this
 * caller jump the queue" and is fully explainable (an executive/supervisor
 * can always see exactly why something got flagged, no black box).
 */

const URGENT_KEYWORDS = [
  "emergency", "urgent", "immediately", "medical", "ambulance", "doctor",
  "unsafe", "harass", "theft", "stolen", "security", "danger", "fire",
  "chest pain", "unconscious", "fainted", "assault",
];

const FRUSTRATION_KEYWORDS = [
  "worst", "useless", "pathetic", "disgusting", "rubbish", "waste of time",
  "fraud", "cheat", "scam", "never again", "third time", "again and again",
  "still not", "no one is helping", "no response", "ignored", "fed up",
  "angry", "furious", "unacceptable", "horrible", "terrible",
];

function countMatches(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce((sum, kw) => (lower.includes(kw) ? sum + 1 : sum), 0);
}

function capsRatio(text) {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 6) return 0; // too short to judge — avoids false positives on short replies
  const caps = letters.replace(/[^A-Z]/g, "");
  return caps.length / letters.length;
}

/**
 * Scores a chunk of customer-said text (a single utterance, or a joined
 * transcript). Returns a priority tier the queue can sort on, plus the
 * reasons — shown to the executive so the flag is never a mystery.
 */
function scoreUrgency(text) {
  if (!text || !text.trim()) return { tier: "normal", score: 0, reasons: [] };

  const reasons = [];
  let score = 0;

  const urgentHits = countMatches(text, URGENT_KEYWORDS);
  if (urgentHits > 0) { score += urgentHits * 3; reasons.push("mentions a safety/medical emergency"); }

  const frustrationHits = countMatches(text, FRUSTRATION_KEYWORDS);
  if (frustrationHits > 0) { score += frustrationHits * 2; reasons.push("frustrated/negative language"); }

  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 2) { score += 1; reasons.push("repeated exclamation marks"); }

  const ratio = capsRatio(text);
  if (ratio > 0.6) { score += 1; reasons.push("ALL CAPS — raised tone"); }

  let tier = "normal";
  if (urgentHits > 0) tier = "emergency"; // safety/medical always wins, regardless of everything else
  else if (score >= 3) tier = "high";
  else if (score >= 1) tier = "elevated";

  return { tier, score, reasons };
}

/** Scores an entire transcript ([{speaker, text}]), using only the customer's lines. */
function scoreTranscript(transcript = []) {
  const customerText = transcript
    .filter((t) => t.speaker === "customer" || t.speaker === "caller")
    .map((t) => t.text)
    .join(". ");
  return scoreUrgency(customerText);
}

const TIER_RANK = { emergency: 3, high: 2, elevated: 1, normal: 0 };

module.exports = { scoreUrgency, scoreTranscript, TIER_RANK };
