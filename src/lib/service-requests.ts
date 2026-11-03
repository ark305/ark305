export type ServiceRequestInput = {
  serviceId: string;
  requestedDate: string;
  guests: number;
  preferences?: string;
};

export type ServiceRequest = {
  id: string;
  serviceId: string;
  requestedDate: string;
  guests: number;
  preferences: string;
  status: "received" | "in_progress" | "closed" | "cancelled";
  createdAt: string;
};

type Fetcher = typeof fetch;

export class ServiceRequestError extends Error {
  constructor(readonly kind: "invalid" | "auth" | "rejected" | "uncertain", message: string = kind) {
    super(message);
    this.name = "ServiceRequestError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVICE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validInput(value: unknown): value is ServiceRequestInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["serviceId", "requestedDate", "guests", "preferences"].includes(key))) return false;
  return typeof body.serviceId === "string" && SERVICE_ID.test(body.serviceId) &&
    isCalendarDate(body.requestedDate) && Number.isInteger(body.guests) &&
    Number(body.guests) >= 1 && Number(body.guests) <= 20 &&
    (body.preferences === undefined || (typeof body.preferences === "string" && body.preferences.length <= 2000));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeRequest(value: unknown): ServiceRequest | null {
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

function authorization(accessToken: string) {
  if (typeof accessToken !== "string" || !accessToken.trim() || /[\s,]/.test(accessToken)) {
    throw new ServiceRequestError("auth");
  }
  return `Bearer ${accessToken}`;
}

async function readResponse(response: Response) {
  if (!response.ok) {
    const kind = response.status === 401 ? "auth" : response.status >= 500 ? "uncertain" : "rejected";
    throw new ServiceRequestError(kind, `Service request failed (${response.status})`);
  }
  try {
    return await response.json() as unknown;
  } catch {
    throw new ServiceRequestError("uncertain", "Invalid service request response");
  }
}

export async function createServiceRequest(
  input: ServiceRequestInput,
  accessToken: string,
  fetcher: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<ServiceRequest> {
  if (!validInput(input)) throw new ServiceRequestError("invalid");
  const response = await fetcher("/api/service-requests", {
    method: "POST",
    headers: { Authorization: authorization(accessToken), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      serviceId: input.serviceId,
      requestedDate: input.requestedDate,
      guests: input.guests,
      preferences: input.preferences ?? "",
    }),
    cache: "no-store",
    ...(signal ? { signal } : {}),
  }).catch(() => {
    throw new ServiceRequestError("uncertain", "Service request outcome is unknown");
  });
  if (response.status !== 201) {
    const kind = response.status === 401 ? "auth" : response.status >= 500 || (response.status >= 200 && response.status < 300) ? "uncertain" : "rejected";
    throw new ServiceRequestError(kind, `Service request outcome was not confirmed (${response.status})`);
  }
  const item = safeRequest(await readResponse(response));
  if (!item || item.status !== "received") throw new ServiceRequestError("uncertain", "Invalid service request response");
  return item;
}

export async function listServiceRequests(
  accessToken: string,
  fetcher: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<ServiceRequest[]> {
  const response = await fetcher("/api/service-requests", {
    method: "GET",
    headers: { Authorization: authorization(accessToken), Accept: "application/json" },
    cache: "no-store",
    ...(signal ? { signal } : {}),
  }).catch(() => {
    throw new ServiceRequestError("uncertain", "Could not load service request history");
  });
  const payload = await readResponse(response);
  if (!isRecord(payload) || !Array.isArray(payload.items) || payload.items.length > 50) {
    throw new ServiceRequestError("uncertain", "Invalid service request history");
  }
  const items = payload.items.map(safeRequest);
  if (items.some((item) => item === null)) throw new ServiceRequestError("uncertain", "Invalid service request history");
  return items as ServiceRequest[];
}
