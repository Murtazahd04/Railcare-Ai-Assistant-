const twilio = require("twilio");

/**
 * Places a real outbound phone call via Twilio — used to call a passenger
 * back on their actual mobile number when the in-app WebRTC call couldn't
 * connect (every executive busy/declined), and bridges them straight to
 * a real human number (TWILIO_EXECUTIVE_FALLBACK_NUMBER) once they pick up.
 *
 * Trial-account reality, not something we can code around: Twilio trial
 * accounts can only call numbers you've verified in Console -> Phone
 * Numbers -> Verified Caller IDs. Calling an unverified number returns a
 * clear Twilio error (code 21215/21608-ish) — we surface that as a plain
 * { ok: false, reason } instead of throwing, same "never break the app"
 * philosophy as whatsapp.js / classifier.js.
 *
 * If TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER aren't set,
 * this silently no-ops.
 */
function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function toE164(mobile) {
  const digits = (mobile || "").replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits; // assume India if no country code given
  return `+${withCountryCode}`;
}

function escapeForSay(text) {
  return String(text).replace(/&/g, "and").replace(/[<>]/g, "");
}

/**
 * Calls `toMobile`, plays `announcement`, then bridges to
 * TWILIO_EXECUTIVE_FALLBACK_NUMBER (or a custom `bridgeTo`). Passing the
 * TwiML inline via the `twiml` param (rather than a `url` Twilio has to
 * fetch back from us) means this works with zero public webhook/ngrok
 * setup — good enough for this use case since the call doesn't need any
 * interactive menu, just an announcement + a direct bridge.
 */
async function placeCallback(toMobile, { announcement, bridgeTo } = {}) {
  const client = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) {
    console.log("[twilioCall] Twilio not fully configured — skipping real callback to:", toMobile);
    return { ok: false, reason: "not_configured" };
  }

  const target = bridgeTo || process.env.TWILIO_EXECUTIVE_FALLBACK_NUMBER;
  const say = escapeForSay(announcement || "This is Indian Railways passenger support, returning your call. Connecting you now.");
  const twiml = target
    ? `<Response><Say voice="Polly.Aditi">${say}</Say><Dial>${target}</Dial></Response>`
    : `<Response><Say voice="Polly.Aditi">${say}</Say></Response>`;

  try {
    const call = await client.calls.create({ to: toE164(toMobile), from, twiml });
    return { ok: true, sid: call.sid };
  } catch (err) {
    // Most common trial-account failure: calling a number that isn't in
    // Verified Caller IDs yet. Surface a message worth showing the user.
    const friendly = /unverified|not verified/i.test(err.message)
      ? "That number isn't verified in your Twilio trial account yet — add it under Console -> Phone Numbers -> Verified Caller IDs."
      : err.message;
    console.error("[twilioCall] failed to place callback:", err.message);
    return { ok: false, reason: friendly };
  }
}

module.exports = { placeCallback };
