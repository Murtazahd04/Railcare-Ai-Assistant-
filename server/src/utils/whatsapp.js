const twilio = require("twilio");

/**
 * Sends a WhatsApp message via Twilio's free WhatsApp Sandbox.
 *
 * Real limitation, not something we can code around: the recipient must
 * have first messaged the Twilio sandbox number with the join code shown
 * on your Twilio Console's WhatsApp Sandbox page (e.g. "join some-word")
 * before they can receive anything from it. That's a Twilio sandbox rule,
 * not a bug here.
 *
 * If TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN aren't set, this silently no-ops
 * (logs and returns) so the rest of the app keeps working without it.
 */
function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function toWhatsAppNumber(mobile) {
  // normalize to E.164-ish and prefix whatsapp:
  const digits = (mobile || "").replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits; // assume India if no country code given
  return `whatsapp:+${withCountryCode}`;
}

async function sendWhatsAppMessage(toMobile, body) {
  const client = getClient();
  if (!client) {
    console.log("[whatsapp] TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN not set — skipping WhatsApp notification:", body);
    return { sent: false, reason: "not_configured" };
  }
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // Twilio's public sandbox number

  try {
    const message = await client.messages.create({ from, to: toWhatsAppNumber(toMobile), body });
    return { sent: true, sid: message.sid };
  } catch (err) {
    console.error("[whatsapp] failed to send:", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendWhatsAppMessage };
