// Every call returns the same shape, never throws:
//   success: { ok: true, data }
//   failure: { ok: false, code, details, fields, conflicts }
// A network failure is reported as DB_UNAVAILABLE: from the user's side the server cannot be
// reached, which is the same case as "no connection" (RF-7.1).

const failure = (code, error = {}) => ({
  ok: false,
  code,
  details: error.details ?? [],
  fields: error.fields ?? [],
  conflicts: error.conflicts ?? [],
});

async function request(path, init, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(path, init);
  } catch {
    return failure("DB_UNAVAILABLE");
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON (for example an error page): handled below.
  }

  if (response.ok && body) return { ok: true, data: body };
  return failure(body?.error?.code ?? "INTERNAL", body?.error);
}

const defaultFetch = (...args) => globalThis.fetch(...args);

// 001/RF-1.1
export async function getActivities({ fetchImpl = defaultFetch } = {}) {
  const result = await request("/api/activities", undefined, fetchImpl);
  if (!result.ok) return result;
  return Array.isArray(result.data.activities) ? { ok: true, data: result.data.activities } : failure("INTERNAL");
}

// 001/RF-2.3
export async function createActivity(input, { fetchImpl = defaultFetch } = {}) {
  const result = await request(
    "/api/activities",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    fetchImpl,
  );
  if (!result.ok) return result;
  return result.data.activity ? { ok: true, data: result.data.activity } : failure("INTERNAL");
}
