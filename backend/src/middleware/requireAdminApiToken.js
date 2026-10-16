import { timingSafeEqual } from "node:crypto";

function requireAdminApiToken(req, res, next) {
  const expected = process.env.ADMIN_API_TOKEN?.trim();
  const provided = req.get("X-Admin-API-Key") ?? "";
  if (!expected) {
    return res.status(503).json({ error: "Fleet administration is not configured." });
  }
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const matches =
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer);
  if (!matches) return res.status(401).json({ error: "Admin authorization required." });
  return next();
}

export { requireAdminApiToken };