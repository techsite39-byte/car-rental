function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);

  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Booking details are too large." });
  }
  if (error?.statusCode === 422) {
    return res.status(422).json({ error: error.message });
  }
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Booking details contain invalid JSON." });
  }
  if (error?.message?.startsWith("Not allowed by CORS")) {
    return res.status(403).json({ error: "This origin is not allowed." });
  }
  if (
    typeof error?.name === "string" &&
    (error.name.startsWith("Mongoose") || error.name.startsWith("Mongo"))
  ) {
    return res.status(503).json({
      code: "database_unavailable",
      error: "Booking confirmation is temporarily unavailable.",
    });
  }
  if (error?.name === "ValidationError") {
    return res.status(422).json({ error: "Booking details are invalid." });
  }

  console.error(
    "Booking API request failed.",
    typeof error?.name === "string" ? error.name : "UnknownError",
  );
  return res.status(500).json({ error: "An unexpected server error occurred." });
}

export { errorHandler };
