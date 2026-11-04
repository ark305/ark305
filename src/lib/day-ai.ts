import { catalog, type Plan } from "./catalog";

const ids = catalog.map((item) => item.id);
export const dayPlanSchema = {
  type: "object", additionalProperties: false, required: ["guests", "understood", "items"],
  properties: {
    guests: { type: "integer", minimum: 1, maximum: 20 },
    understood: { type: "boolean" },
    items: { type: "array", maxItems: 10, items: {
      type: "object", additionalProperties: false, required: ["id", "time", "qty"],
      properties: {
        id: { type: "string", enum: ids },
        time: { type: "string", pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$" },
        qty: { type: "integer", minimum: 1, maximum: 12 },
      },
    } },
  },
};

export const dayPlanInstructions = `Return only a day plan matching the JSON schema. Use only this demo catalog:
${JSON.stringify(catalog.map(({ id, name, desc, unit }) => ({ id, name, description: desc, unit })))}
Never invent service IDs, prices, confirmed providers or availability. Use each ID at most once.
For unrelated requests or when no service fits, return understood=false and items=[]. Otherwise understood=true.
Guests must be 1-20; quantity is hours for hourly services and 1 for other units. Times are local HH:MM.`;

export function parseDayPlan(value: unknown): Plan | null {
  if (!value || typeof value !== "object") return null;
  const plan = value as Partial<Plan>;
  if (!Number.isInteger(plan.guests) || plan.guests! < 1 || plan.guests! > 20 ||
      typeof plan.understood !== "boolean" || !Array.isArray(plan.items) || plan.items.length > 10 ||
      plan.understood !== (plan.items.length > 0)) return null;
  const seen = new Set<string>();
  const items: Plan["items"] = [];
  for (const item of plan.items) {
    const service = item && catalog.find((entry) => entry.id === item.id);
    if (!service || seen.has(item.id) || typeof item.time !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) || !Number.isInteger(item.qty) ||
        item.qty < 1 || item.qty > 12 || (service.unit !== "h" && item.qty !== 1)) return null;
    seen.add(item.id);
    items.push({ id: item.id, time: item.time, qty: item.qty, guests: plan.guests! });
  }
  return { items, guests: plan.guests!, understood: plan.understood };
}

export type DayProvenance = { provider: "Meta"; model: string; responseId: string };
export type CatalogToolEvidence = { name: "search_catalog" | "get_complements"; callId: string;
  arguments: Record<string, string>; serviceIds: string[]; source: "demo"; availability: "unverified" };

export function parseCatalogTools(value: unknown): CatalogToolEvidence[] | null {
  if (!Array.isArray(value) || !value.length || value.length > 3) return null;
  const seen = new Set<string>();
  for (const tool of value) {
    if (!tool || !["search_catalog", "get_complements"].includes(tool.name) ||
        typeof tool.callId !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(tool.callId) || seen.has(tool.callId) ||
        tool.source !== "demo" || tool.availability !== "unverified" ||
        !Array.isArray(tool.serviceIds) || tool.serviceIds.length > catalog.length || tool.serviceIds.some((id: unknown) => typeof id !== "string" || !ids.includes(id)) ||
        !tool.arguments || typeof tool.arguments !== "object" || Array.isArray(tool.arguments) ||
        Object.keys(tool.arguments).length !== 1 ||
        typeof tool.arguments[tool.name === "search_catalog" ? "query" : "serviceId"] !== "string" ||
        Object.values(tool.arguments).some(value => typeof value !== "string" || value.length > 120)) return null;
    seen.add(tool.callId);
  }
  return value;
}

export async function requestDayPlan(input: { prompt: string; guests: number; locale: string }, token: string | undefined,
  fetcher: typeof fetch = fetch): Promise<{ plan: Plan; provenance: DayProvenance; tools: CatalogToolEvidence[] }> {
  if (!token) throw new Error("auth");
  const response = await fetcher("/api/ai", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...input, task: "day-plan" }), signal: AbortSignal.timeout(70000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "upstream");
  const plan = parseDayPlan(data.plan);
  const proof = data.provenance;
  const tools = parseCatalogTools(data.tools);
  if (!plan || proof?.provider !== "Meta" || typeof proof.model !== "string" || !proof.model ||
      typeof proof.responseId !== "string" || !proof.responseId || !tools ||
      plan.items.some(item => !tools.some(tool => tool.serviceIds.includes(item.id)))) throw new Error("invalid_plan");
  return { plan, provenance: proof, tools };
}
