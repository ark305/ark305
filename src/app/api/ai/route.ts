import { NextRequest } from "next/server";

const DEFAULT_API_ORIGIN = "http://127.0.0.1:3001";
const API_PATH = "/api/v1/ai";
const MAX_BODY_LENGTH = 256_000;

function apiOrigin(): URL | null {
  try {
    const origin = new URL(process.env.ARK_API_URL ?? DEFAULT_API_ORIGIN);
    const validProtocol = origin.protocol === "https:" || origin.protocol === "http:";
    const safeHttpHost = origin.protocol !== "http:" || ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
    if (!validProtocol || !safeHttpHost || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
    return origin;
  } catch {
    return null;
  }
}

function errorResponse(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer [^\s,]+$/i.test(authorization)) return errorResponse(401, "auth");
  const origin = apiOrigin();
  if (!origin) return errorResponse(503, "ai_not_configured");
  let body: string;
  try {
    body = await request.text();
    if (!body || new TextEncoder().encode(body).byteLength > MAX_BODY_LENGTH) return errorResponse(400, "prompt");
    JSON.parse(body);
  } catch {
    return errorResponse(400, "prompt");
  }

  try {
    const response = await fetch(new URL(API_PATH, origin), {
      method: "POST",
      headers: { Authorization: authorization, Accept: "application/json", "Content-Type": "application/json" },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
    });
    let payload: unknown;
    try { payload = await response.json(); } catch { return errorResponse(502, "upstream"); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return errorResponse(502, "upstream");
    if (!response.ok) {
      const upstreamError = "error" in payload && typeof payload.error === "string" ? payload.error : "";
      if (response.status === 401) return errorResponse(401, "auth");
      const allowedErrors = new Set(["ai_not_configured", "auth", "prompt", "diagnosis_input", "rate_limited", "quota_unavailable", "upstream", "invalid_plan", "invalid_diagnosis"]);
      if (!allowedErrors.has(upstreamError)) return errorResponse(response.status === 400 ? 400 : 503, "upstream");
      if (upstreamError === "invalid_diagnosis") {
        const reasons = new Set(["truncated", "invalid_metadata", "invalid_answers", "invalid_json"]);
        const reason = "reason" in payload && typeof payload.reason === "string" && reasons.has(payload.reason) ? payload.reason : null;
        return Response.json({ error: upstreamError, ...(reason ? { reason } : {}) }, { status: response.status, headers: { "Cache-Control": "no-store" } });
      }
      if (response.status !== 400 && response.status !== 429 && response.status !== 502 && response.status !== 503) return errorResponse(503, "upstream");
      return errorResponse(response.status, upstreamError);
    }
    return Response.json(payload, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse(503, "upstream");
  }
}
