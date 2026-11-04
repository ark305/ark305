import { NextRequest } from "next/server";

const API_PATH = "/api/v1/service-requests";
const DEFAULT_API_ORIGIN = "http://127.0.0.1:3001";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVICE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BODY_LENGTH = 4096;

type ServiceRequestDto = {
  id: string;
  serviceId: string;
  requestedDate: string;
  guests: number;
  preferences: string;
  status: "received" | "in_progress" | "closed" | "cancelled";
  createdAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

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

function bearer(request: NextRequest): string | null {
  const value = request.headers.get("authorization");
  return value && /^Bearer [^\s,]+$/i.test(value) ? value : null;
}

function validBody(value: unknown): value is { serviceId: string; requestedDate: string; guests: number; preferences?: string } {
  if (!isRecord(value) || Object.keys(value).some((key) => !["serviceId", "requestedDate", "guests", "preferences"].includes(key))) return false;
  return typeof value.serviceId === "string" && SERVICE_ID.test(value.serviceId) &&
    isCalendarDate(value.requestedDate) && Number.isInteger(value.guests) &&
    Number(value.guests) >= 1 && Number(value.guests) <= 20 &&
    (value.preferences === undefined || (typeof value.preferences === "string" && value.preferences.length <= 2000));
}

function safeDto(value: unknown): ServiceRequestDto | null {
  if (!isRecord(value) || typeof value.id !== "string" || !UUID.test(value.id) ||
      typeof value.serviceId !== "string" || !SERVICE_ID.test(value.serviceId) ||
      !isCalendarDate(value.requestedDate) || !Number.isInteger(value.guests) ||
      Number(value.guests) < 1 || Number(value.guests) > 20 ||
      typeof value.preferences !== "string" || value.preferences.length > 2000 ||
      (value.status !== "received" && value.status !== "in_progress" && value.status !== "closed" && value.status !== "cancelled") || typeof value.createdAt !== "string" ||
      !Number.isFinite(Date.parse(value.createdAt))) return null;
  return {
    id: value.id,
    serviceId: value.serviceId,
    requestedDate: value.requestedDate,
    guests: Number(value.guests),
    preferences: value.preferences,
    status: value.status,
    createdAt: value.createdAt,
  };
}

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function requestNest(request: NextRequest, method: "GET" | "POST", body?: unknown) {
  const token = bearer(request);
  if (!token) return errorResponse(401, "Authentication required");
  const origin = apiOrigin();
  if (!origin) return errorResponse(503, "Service requests are unavailable");

  try {
    const response = await fetch(new URL(API_PATH, origin), {
      method,
      headers: {
        Authorization: token,
        Accept: "application/json",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });

    const expectedStatus = method === "POST" ? 201 : 200;
    if (!response.ok || response.status !== expectedStatus) {
      if (response.status === 400) return errorResponse(400, "Service request was not accepted");
      if (response.status === 401) return errorResponse(401, "Authentication required");
      if (response.status === 404) return errorResponse(404, "Service request was not found");
      return errorResponse(503, "Service requests are unavailable");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return errorResponse(502, "Invalid response from service requests");
    }
    if (method === "POST") {
      const item = safeDto(payload);
      return item?.status === "received" ? Response.json(item, { status: 201, headers: { "Cache-Control": "no-store" } }) :
        errorResponse(502, "Invalid response from service requests");
    }
    if (!isRecord(payload) || !Array.isArray(payload.items) || payload.items.length > 50) {
      return errorResponse(502, "Invalid response from service requests");
    }
    const items = payload.items.map(safeDto);
    if (items.some((item) => item === null)) return errorResponse(502, "Invalid response from service requests");
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse(503, "Service requests are unavailable");
  }
}

export async function GET(request: NextRequest) {
  return requestNest(request, "GET");
}

export async function POST(request: NextRequest) {
  if (!bearer(request)) return errorResponse(401, "Authentication required");
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return errorResponse(400, "Invalid service request");
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_LENGTH) return errorResponse(400, "Invalid service request");

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return errorResponse(400, "Invalid service request");
  }
  if (raw.length === 0 || raw.length > MAX_BODY_LENGTH) return errorResponse(400, "Invalid service request");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return errorResponse(400, "Invalid service request");
  }
  if (!validBody(value)) return errorResponse(400, "Invalid service request");
  return requestNest(request, "POST", {
    serviceId: value.serviceId,
    requestedDate: value.requestedDate,
    guests: Number(value.guests),
    preferences: typeof value.preferences === "string" ? value.preferences : "",
  });
}
