const STATUS_BY_CODE = {
  VALIDATION_FAILED: 422,
  OVERLAP: 409,
  DUPLICATE_OVERLAP: 409,
  DB_UNAVAILABLE: 503,
  DATA_CORRUPT: 500,
  INTERNAL: 500,
};

// Translates a failed service result into an HTTP answer. It only maps codes to statuses and
// copies the details; it decides nothing about the business rules.
export function sendFailure(res, result) {
  const { ok, code, ...extra } = result;
  const status = STATUS_BY_CODE[code] ?? 500;
  const body = STATUS_BY_CODE[code] ? { code, ...extra } : { code: "INTERNAL" };
  return res.status(status).json({ error: body });
}
