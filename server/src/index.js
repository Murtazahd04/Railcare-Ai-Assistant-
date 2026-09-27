require("dotenv").config();
const express = require("express");
require("express-async-errors"); // patches Express so a rejected promise in any async route handler
// reaches the error-handling middleware below instead of crashing the whole
// process — without this, ANY database hiccup (a dropped Atlas connection,
// a slow failover) in even one request takes down the WebRTC signaling for
// every passenger/executive currently on a call, not just that one request.
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const { Server } = require("socket.io");

const { connectDB } = require("./db");
const { attachSignaling } = require("./socket/signaling");
const { generalLimiter, authLimiter } = require("./middleware/rateLimit");
const { runEscalationSweep } = require("./utils/escalation");

const authRoutes = require("./routes/auth");
const passengerRoutes = require("./routes/passengers");
const trainRoutes = require("./routes/trains");
const rfidRoutes = require("./routes/rfid");
const complaintRoutes = require("./routes/complaints");
const fineRoutes = require("./routes/fines");
const callRoutes = require("./routes/calls");
const kbRoutes = require("./routes/kb");
const telephonyRoutes = require("./routes/telephony");
const publicRoutes = require("./routes/public");
const voiceRoutes = require("./routes/voice");

const PORT = process.env.PORT || 4000;

// Last-resort safety net for anything express-async-errors can't reach —
// socket.io event handlers and the setInterval escalation sweep aren't
// Express requests, so a rejected promise there isn't "one request failing,"
// it's the whole process by default. Log it and keep the server up rather
// than dropping every active call because one socket handler hit a hiccup.
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

async function main() {
  await connectDB();

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false })); // CSP off for local dev simplicity; enable/tune before any real deployment
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false })); // Twilio webhooks are form-encoded, not JSON
  app.use(mongoSanitize()); // strips $/. operators from req.body/query/params — blocks NoSQL injection attempts
  app.use(generalLimiter);

  app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use("/api/v1/auth", authLimiter, authRoutes); // stricter limit specifically on login/session endpoints
  app.use("/api/v1/passengers", passengerRoutes);
  app.use("/api/v1/trains", trainRoutes);
  app.use("/api/v1/rfid", rfidRoutes);
  app.use("/api/v1/complaints", complaintRoutes);
  app.use("/api/v1/fines", fineRoutes);
  app.use("/api/v1/calls", callRoutes);
  app.use("/api/v1/kb", kbRoutes);
  app.use("/api/v1/telephony", telephonyRoutes);
  app.use("/api/v1/public", publicRoutes); // passenger self-service — verified by PNR+mobile, not JWT
  app.use("/api/v1/voice", voiceRoutes); // STT/TTS proxy to the optional Python ai-service

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  attachSignaling(io);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`SRLMS server (REST API + WebRTC signaling) listening on port ${PORT}`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://0.0.0.0:${PORT} (use your machine's IP, e.g. http://10.181.125.35:${PORT})`);
    console.log(`REST base: http://localhost:${PORT}/api/v1`);
  });

  // CPGRAMS-style auto-escalation: check every 10 minutes for complaints
  // that have sat too long at their current level. See utils/escalation.js
  // for the thresholds (ESCALATION_LEVEL1_HOURS / ESCALATION_LEVEL2_HOURS).
  const ESCALATION_SWEEP_INTERVAL_MS = 10 * 60 * 1000;
  setInterval(() => {
    runEscalationSweep().catch((err) => console.error("[escalation] sweep failed:", err.message));
  }, ESCALATION_SWEEP_INTERVAL_MS);
  runEscalationSweep().catch((err) => console.error("[escalation] initial sweep failed:", err.message)); // also run once at boot
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
