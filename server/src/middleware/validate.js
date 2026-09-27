const { ZodError } = require("zod");

/**
 * validateBody(schema) -> Express middleware
 * Parses req.body against a zod schema; on success replaces req.body with
 * the parsed (and coerced/defaulted) value; on failure returns 400 with a
 * readable list of what's wrong instead of letting bad data hit Mongoose.
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
        });
      }
      next(err);
    }
  };
}

module.exports = { validateBody };
