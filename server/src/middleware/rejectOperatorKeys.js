// RNF-9
// Rejects bodies with a key that starts with "$" at any depth, such as { "day": { "$ne": "x" } }.
// MongoDB reads those keys as query operators, so they are never accepted as data.
function hasOperatorKey(value) {
  if (Array.isArray(value)) return value.some(hasOperatorKey);
  if (value !== null && typeof value === "object") {
    return Object.keys(value).some((key) => key.startsWith("$") || hasOperatorKey(value[key]));
  }
  return false;
}

export function rejectOperatorKeys(req, res, next) {
  if (hasOperatorKey(req.body)) return res.status(400).json({ error: { code: "INVALID_BODY" } });
  return next();
}
