// POST /api/ai — Asistente IA de ARK305 (Claude).
// La llave de Anthropic vive solo aquí, en el servidor. Nunca llega al navegador.
// v3: ARK combina Experiencias + Negocios y lee el modo del usuario (lifestyle/business/both).
import { NextResponse } from "next/server";

// Nunca dejar la petición colgada: tope total de la función y tope por cada llamada externa.
export const maxDuration = 60;
const AUTH_TIMEOUT_MS = 5000;
const DB_TIMEOUT_MS = 5000;
const AI_TIMEOUT_MS = 45000;
const timeout = (ms: number) => AbortSignal.timeout(ms);

const MODELS = {
  default: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
  quick: process.env.ANTHROPIC_MODEL_QUICK || "claude-haiku-5-5",
};

const SYSTEM = {
  es: "Eres ARK, el asistente personal de ARK305, la App de la Vida. Cubres dos mundos: EXPERIENCIAS (vida y lujo en Miami — chofer, yate, chef, limpieza, fotos, sesiones de contenido con creadores, talento, ARK Pass) y NEGOCIOS (agentes de IA de voz y chat, automatizaciones, HighLevel, sistemas que venden). Detecta en qué mundo está la persona y combina ambos cuando tenga sentido: muchos quieren vivir la experiencia Y montar el negocio (ej. un día de grabación en yate + su propio agente de IA). Pon siempre el contenido correcto según el escenario, sin mezclar de forma confusa. Hablas español con calidez premium, estilo Apple: claro, breve, sin relleno. No inventes precios ni disponibilidad; si no sabes algo, dilo.",
  en: "You are ARK, the personal assistant of ARK305, the Life App. You cover two worlds: EXPERIENCES (life and luxury in Miami — driver, yacht, chef, cleaning, photos, content sessions with creators, talent, ARK Pass) and BUSINESS (voice and chat AI agents, automations, HighLevel, systems that sell). Detect which world the person is in and combine both when it makes sense: many want to live the experience AND build the business (e.g. a content day on a yacht + their own AI agent). Always put the right content in place for each scenario, without confusing the two. You speak English with premium warmth, Apple-like style: clear, brief, no fluff. Never invent prices or availability; if you don't know something, say so.",
};

export async function POST(req: Request) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // 1. Solo usuarios con sesión. Sin token: 401 inmediato, sin tocar nada externo.
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_KEY)
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });

  let who: { id: string };
  try {
    const me = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      signal: timeout(AUTH_TIMEOUT_MS),
    });
    if (!me.ok) return NextResponse.json({ error: "auth" }, { status: 401 });
    who = await me.json();
    if (!who?.id) return NextResponse.json({ error: "auth" }, { status: 401 });
  } catch (e) {
    console.error("auth check failed", e);
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "es";

  // 2. Límite diario por persona
  const limit = parseInt(process.env.AI_DAILY_LIMIT || "60", 10);
  try {
    const bump = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bump_ai`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lim: limit }),
      signal: timeout(DB_TIMEOUT_MS),
    });
    if (bump.ok && (await bump.json()) === false)
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  } catch (e) {
    // Si el contador no responde, seguimos: mejor responder que colgarse.
    console.error("bump_ai failed", e);
  }

  // 2b. Modo del usuario: lifestyle / business / both (si su perfil lo tiene)
  let modeLine = "";
  try {
    const prof = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=experience&id=eq.${who.id}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }, signal: timeout(DB_TIMEOUT_MS) }
    );
    if (prof.ok) {
      const rows = await prof.json().catch(() => []);
      const exp = rows && rows[0] && rows[0].experience;
      if (exp === "lifestyle" || exp === "business" || exp === "both") {
        modeLine =
          locale === "en"
            ? ` The user is in ${exp} mode.`
            : ` El usuario está en modo: ${exp}.`;
      }
    }
  } catch {
    /* sin perfil: ARK detecta el modo por el contexto */
  }

  // 3. Llamar a Claude
  const prompt = String(body.prompt || "").slice(0, 60000);
  if (!prompt) return NextResponse.json({ error: "prompt" }, { status: 400 });
  const system =
    SYSTEM[locale] +
    modeLine +
    (body.json ? " Respond ONLY with valid JSON, no extra text or code blocks." : "");

  let r: Response;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: body.tier === "quick" ? MODELS.quick : MODELS.default,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: timeout(AI_TIMEOUT_MS),
  });
  } catch (e) {
    console.error("anthropic timeout/network", e);
    return NextResponse.json({ error: "upstream_timeout" }, { status: 504 });
  }
  if (r.status === 429) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  if (!r.ok) {
    console.error("anthropic", r.status, await r.text());
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
  const data = await r.json();
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
  return NextResponse.json({ text, user: who.id });
}
