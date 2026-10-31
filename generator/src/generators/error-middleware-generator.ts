export function generateErrorMiddleware(): string {
  return `import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const details = typeof error === "object" && error !== null
    ? error as { code?: unknown; type?: unknown }
    : {};
  if (details.code === "P2002") {
    res.status(409).json({ error: "A record with this unique value already exists" });
    return;
  }
  if (details.code === "P2025") {
    res.status(404).json({ error: "Record not found" });
    return;
  }
  if (details.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }
  if (details.type === "entity.too.large") {
    res.status(413).json({ error: "JSON body is too large" });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
`;
}
