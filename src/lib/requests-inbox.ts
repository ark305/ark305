import { safeRequest, type ServiceRequest } from "@/lib/service-requests";

export type RequestStatus = ServiceRequest["status"];
export type InboxRequest = ServiceRequest & { requesterId?: string };
export type RequestEvent = { id: string; fromStatus: RequestStatus; toStatus: RequestStatus; createdAt: string };
export const requestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InboxError extends Error {
  constructor(readonly status: number) { super(`Request operation failed (${status})`); }
}

export function nextStatuses(status: RequestStatus): RequestStatus[] {
  return status === "received" ? ["in_progress", "cancelled"] : status === "in_progress" ? ["closed", "cancelled"] : [];
}

export function safeInboxItem(value: unknown, admin: boolean): InboxRequest {
  const item = safeRequest(value);
  if (!item) throw new InboxError(502);
  if (!admin) return item;
  const requesterId = (value as Record<string, unknown>).requesterId;
  if (typeof requesterId !== "string" || !requestId.test(requesterId)) throw new InboxError(502);
  return { ...item, requesterId };
}

export function safeEvents(value: unknown): RequestEvent[] {
  return collection(value).map((event) => {
    if (!event || typeof event !== "object") throw new InboxError(502);
    const row = event as RequestEvent;
    if (typeof row.id !== "string" || !requestId.test(row.id) ||
      !nextStatuses(row.fromStatus).includes(row.toStatus) || typeof row.createdAt !== "string" ||
      !Number.isFinite(Date.parse(row.createdAt))) throw new InboxError(502);
    return { id: row.id, fromStatus: row.fromStatus, toStatus: row.toStatus, createdAt: row.createdAt };
  });
}

export function collection(value: unknown): unknown[] {
  const items = value && typeof value === "object" ? (value as { items?: unknown }).items : null;
  if (!Array.isArray(items) || items.length > 50) throw new InboxError(502);
  return items;
}

async function send(path: string, token: string, fetcher: typeof fetch, signal?: AbortSignal, body?: unknown) {
  if (!token || /[\s,]/.test(token)) throw new InboxError(401);
  let response: Response;
  try {
    response = await fetcher(path, {
      method: body ? "PATCH" : "GET", cache: "no-store", signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new InboxError(503); }
  if (!response.ok) throw new InboxError(response.status);
  if (response.status !== 200) throw new InboxError(502);
  try { return await response.json() as unknown; } catch { throw new InboxError(502); }
}

export async function readInbox(token: string, fetcher: typeof fetch = fetch, signal?: AbortSignal) {
  let value: unknown;
  let admin = true;
  try { value = await send("/api/requests-inbox/admin", token, fetcher, signal); }
  catch (error) {
    if (!(error instanceof InboxError) || error.status !== 403) throw error;
    admin = false;
    value = await send("/api/service-requests", token, fetcher, signal);
  }
  return { admin, items: collection(value).map((item) => safeInboxItem(item, admin)) };
}

export async function readHistory(id: string, admin: boolean, token: string, fetcher: typeof fetch = fetch, signal?: AbortSignal) {
  if (!requestId.test(id)) throw new InboxError(400);
  return safeEvents(await send(`/api/requests-inbox/${admin ? "admin/" : ""}${id.toLowerCase()}/history`, token, fetcher, signal));
}

export async function changeRequest(item: ServiceRequest, status: RequestStatus, token: string, fetcher: typeof fetch = fetch, signal?: AbortSignal) {
  if (!requestId.test(item.id) || !nextStatuses(item.status).includes(status)) throw new InboxError(400);
  const result = safeRequest(await send(`/api/requests-inbox/admin/${item.id.toLowerCase()}`, token, fetcher, signal, { expectedStatus: item.status, status }));
  if (!result || result.id.toLowerCase() !== item.id.toLowerCase() || result.status !== status) throw new InboxError(502);
  return result;
}
