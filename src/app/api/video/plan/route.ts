// POST /api/video/plan — ARK IA organiza el contenido de una sesión de video.
// Pública (es para el evento), con límite por IP. Sin llave o si el modelo falla: plan demo, nunca se rompe.
import { NextResponse } from "next/server";
import { aiProvider, complete } from "@/lib/llm";
import { demoPlan, sanitizePlan, videoPackages } from "@/lib/video";

const LIMIT = 12; // planes por IP por hora
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

const SYSTEM = (locale: "es" | "en") =>
  `You are ARK, the content producer of ARK305 in Miami. A client describes what they want to film. Plan the video session so a videographer can execute it and the client knows exactly what they get and when to post it.
Return ONLY valid JSON, no extra text:
{"title": string (max 8 words), "summary": string (1 sentence), "shots": [{"scene": string, "detail": string}] (5 items), "deliverables": [{"name": string, "format": string (duration · aspect ratio), "due": string}] (3 items), "calendar": [{"day": string, "piece": string, "platform": string}] (5 items), "packageId": one of ${videoPackages.map((p) => `"${p.id}"`).join(", ")}}
Packages: ${videoPackages.map((p) => `${p.id} = ${p.name.en}, $${p.price}, ${p.hours} h (${p.includes.map((i) => i.en).join("; ")})`).join(" | ")}.
Pick the smallest package that covers the request. Be concrete and brief. Write every string in ${locale === "es" ? "Spanish" : "English"}.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "es";
  const brief = String(body.brief || "").trim().slice(0, 800);
  if (brief.length < 3) return NextResponse.json({ error: "brief" }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!aiProvider() || !allowed(ip)) return NextResponse.json(demoPlan(brief, locale));

  try {
    const { text, provider } = await complete({ system: SYSTEM(locale), prompt: brief, maxTokens: 1200, timeoutMs: 20_000 });
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const plan = sanitizePlan(JSON.parse(json));
    if (!plan) throw new Error("invalid plan");
    return NextResponse.json(plan, { headers: { "x-ark-ai": provider } });
  } catch (e) {
    console.error("video plan", e);
    return NextResponse.json(demoPlan(brief, locale));
  }
}
