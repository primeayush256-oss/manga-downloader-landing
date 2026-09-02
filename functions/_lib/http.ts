/**
 * Small HTTP helpers shared by the payment endpoints.
 *
 * Responses are deliberately terse and never echo internal detail (stack
 * traces, Razorpay raw errors, SQL, secrets). Callers pass a stable `error`
 * code the frontend can branch on plus a safe human message.
 */

export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function ok(body: Record<string, unknown> = {}): Response {
  return json({ ok: true, ...body }, 200);
}

export function errorResponse(
  status: number,
  code: string,
  message: string
): Response {
  return json({ ok: false, error: code, message }, status);
}

/** 405 with an Allow header, for endpoints that only accept one method. */
export function methodNotAllowed(allow: string): Response {
  return json({ ok: false, error: "method_not_allowed" }, 405, {
    allow,
  });
}

/** Parses a JSON body defensively; returns null on any problem. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
