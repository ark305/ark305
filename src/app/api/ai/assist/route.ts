// POST /api/ai/assist — ARK IA en vivo para el demo: Mi día, Equipo (Business) y ARK IA para vender.
// Pública y con límite por IP. Sin llave, sobre el límite o si el modelo falla: { fallback: true } y la pantalla usa su vista previa.
import { NextResponse } from "next/server";
import { aiProvider, complete } from "@/lib/llm";
import { catalog, finishPlan, getItem } from "@/lib/catalog";
import { positions } from "@/lib/talent";

const LIMIT = 30; // respuestas por IP por hora
const hits = new Map<string, { n: number; reset: number }>();

function allowed(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 3_600_000 });
    return true;
  }
  h.n += 1;
  return h.n <= LIMIT;
}

const lang = (locale: string) => (locale === "en" ? "English" : "Spanish");
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const int = (v: unknown, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
const json = (text: string) => JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
const fallback = () => NextResponse.json({ fallback: true });

type Body = Record<string, unknown>;

async function day(b: Body) {
  const prompt = str(b.prompt, 600);
  if (prompt.length < 3) return null;
  const guests = int(b.guests, 1, 20);
  const system = `You are ARK, the Miami concierge of ARK305. Plan the client's day using ONLY these catalog items (id: name, price, unit h=per hour / p=per person / f=flat):
${catalog.map((c) => `${c.id}: ${c.name.en}, $${c.price}/${c.unit}${c.hours ? ` (hour options ${c.hours.join(",")})` : ""}`).join("\n")}
Return ONLY valid JSON: {"guests": number (1-20, default ${guests}), "items": [{"id": string, "time": "HH:MM" 24h, "qty": number (hours for unit h, otherwise 1)}]} with 2-6 items in a sensible order. Don't add a driver; ARK adds it.`;
  const { text, provider } = await complete({ system, prompt, maxTokens: 500, quick: true, timeoutMs: 15_000 });
  const out = json(text);
  const g = int(out.guests ?? guests, 1, 20);
  const items = (Array.isArray(out.items) ? out.items : [])
    .filter((i: Body) => getItem(String(i.id)) && /^([01]\d|2[0-3]):[0-5]\d$/.test(String(i.time)))
    .slice(0, 6)
    .map((i: Body) => {
      const c = getItem(String(i.id))!;
      let qty = c.unit === "h" ? int(i.qty, 1, 12) : 1;
      if (c.hours?.length) qty = c.hours.reduce((a, h) => (Math.abs(h - qty) < Math.abs(a - qty) ? h : a), c.hours[0]);
      return { id: c.id, time: String(i.time), qty, guests: g };
    });
  if (!items.length) return null;
  return { plan: finishPlan(items, g), provider };
}

async function team(b: Body) {
  const prompt = str(b.prompt, 600);
  if (prompt.length < 3) return null;
  const system = `You are ARK, the business operator of ARK305. Build the smallest team that solves the client's need using ONLY these positions (id: name, rate, unit h=hourly / p=per project / f=flat / m=monthly / q=quote):
${positions.map((p) => `${p.id}: ${p.name.en}, $${p.rate}/${p.unit}`).join("\n")}
Return ONLY valid JSON: {"roles": [{"id": string, "hours": number (hours per week for unit h, 5-40; otherwise 0)}]} with 1-5 roles.`;
  const { text, provider } = await complete({ system, prompt, maxTokens: 400, quick: true, timeoutMs: 15_000 });
  const out = json(text);
  const roles = (Array.isArray(out.roles) ? out.roles : [])
    .filter((r: Body) => positions.some((p) => p.id === String(r.id)))
    .slice(0, 5)
    .map((r: Body) => ({ id: String(r.id), hours: int(r.hours, 0, 40) }));
  if (!roles.length) return null;
  return { roles, provider };
}

const SELLER = {
  lifestyle: {
    post: "Write a short Instagram post (max 60 words, 2-3 emojis, 3 hashtags) promoting the first service.",
    reply: "Reply to a DM from a client asking about the second service: friendly, price included, propose a time, close with the booking link.",
    price: "Give a 2-sentence pricing suggestion for the second service in Miami with a low-high range and one way to charge more.",
  },
  business: {
    post: "Write a short, professional proposal email (max 70 words) for the first service.",
    reply: "Write a short, professional follow-up message on a proposal for the second service, with a clear next step.",
    price: "Suggest a resale margin for the second service in 2 sentences, with the client price range.",
  },
} as const;

async function seller(b: Body) {
  const tone = b.tone === "business" ? "business" : "lifestyle";
  const action = b.action === "reply" || b.action === "price" ? b.action : "post";
  const name = str(b.name, 60);
  const handle = str(b.handle, 40).replace(/[^\w.-]/g, "");
  const services = (Array.isArray(b.services) ? b.services : []).slice(0, 6).map((s: Body) => `${str(s.title, 80)} ($${int(s.price, 0, 1_000_000)})`);
  if (!services.length) return null;
  const system = `You are ARK AI, the sales assistant inside ARK305 (Miami). You write for a provider's profile. Never invent facts beyond the data given. Booking link: ark305.com/@${handle}. Plain text only, no markdown. Write in ${lang(str(b.locale, 2))}.`;
  const prompt = `${SELLER[tone][action]}\nProvider: ${name}\nServices: ${services.join("; ")}`;
  const { text, provider } = await complete({ system, prompt, maxTokens: 300, quick: true, timeoutMs: 15_000 });
  const clean = text.trim();
  return clean ? { text: clean, provider } : null;
}

export async function POST(req: Request) {
  const b: Body = await req.json().catch(() => ({}));
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!aiProvider() || !allowed(ip)) return fallback();
  try {
    const r = b.kind === "day" ? await day(b) : b.kind === "team" ? await team(b) : b.kind === "seller" ? await seller(b) : null;
    return r ? NextResponse.json(r, { headers: { "x-ark-ai": r.provider } }) : fallback();
  } catch (e) {
    console.error("ai assist", e);
    return fallback();
  }
}
