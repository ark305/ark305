import { collection, InboxError, requestId, safeEvents, safeInboxItem } from "@/lib/requests-inbox";

type Context = { params: Promise<{ segments?: string[] }> };
const headers = { "Cache-Control": "no-store" };
const failure = (status: number) => Response.json({ error: "Request operation unavailable" }, { status, headers });

async function proxy(request: Request, context: Context, method: "GET" | "PATCH") {
  const token = request.headers.get("authorization");
  if (!token || !/^Bearer [^\s,]+$/i.test(token)) return failure(401);
  const { segments = [] } = await context.params;
  const admin = segments[0] === "admin";
  const parts = admin ? segments.slice(1) : segments;
  const history = parts.length === 2 && requestId.test(parts[0]) && parts[1] === "history";
  const list = admin && parts.length === 0;
  const update = admin && parts.length === 1 && requestId.test(parts[0]);
  if (method === "GET" ? !list && !history : !update) return failure(400);
  let body: unknown;
  if (method === "PATCH") {
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return failure(400);
    try {
      const raw = await request.text();
      if (raw.length > 512) return failure(400);
      const value = JSON.parse(raw) as { expectedStatus?: unknown; status?: unknown };
      if (!value || Array.isArray(value) || Object.keys(value).some((key) => !["expectedStatus", "status"].includes(key)) ||
        typeof value.expectedStatus !== "string" || !/^[a-z_]{1,20}$/.test(value.expectedStatus) ||
        typeof value.status !== "string" || !/^[a-z_]{1,20}$/.test(value.status)) return failure(400);
      body = { expectedStatus: value.expectedStatus, status: value.status };
    } catch { return failure(400); }
  }
  try {
    const origin = new URL(process.env.ARK_API_URL ?? "http://127.0.0.1:3001");
    if ((origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return failure(503);
    const path = `/api/v1/${admin ? "admin/" : ""}service-requests${parts.length ? `/${parts.join("/").toLowerCase()}` : ""}`;
    const response = await fetch(new URL(path, origin), {
      method, headers: { Authorization: token, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return failure([400, 401, 403, 404, 409, 503].includes(response.status) ? response.status : 503);
    if (response.status !== 200) return failure(502);
    let value: unknown;
    try { value = await response.json(); } catch { return failure(502); }
    if (history) return Response.json({ items: safeEvents(value) }, { headers });
    if (list) return Response.json({ items: collection(value).map((item) => safeInboxItem(item, true)) }, { headers });
    const item = safeInboxItem(value, false);
    if (item.id.toLowerCase() !== parts[0].toLowerCase() || item.status !== (body as { status: string }).status) return failure(502);
    return Response.json(item, { headers });
  } catch (error) { return failure(error instanceof InboxError ? error.status : 503); }
}

export const GET = (request: Request, context: Context) => proxy(request, context, "GET");
export const PATCH = (request: Request, context: Context) => proxy(request, context, "PATCH");
