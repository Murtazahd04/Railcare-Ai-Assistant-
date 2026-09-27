const rateLimit = require("express-rate-limit");

// generous general-purpose limit — protects against accidental hammering / basic abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

// strict limit specifically on login/auth endpoints — this is what actually
// matters: without it, someone can brute-force the demo passwords
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

module.exports = { generalLimiter, authLimiter };
