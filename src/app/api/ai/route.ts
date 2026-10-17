// POST /api/ai — Asistente IA de ARK305 (Claude).
// La llave de Anthropic vive solo aquí, en el servidor. Nunca llega al navegador.
// La sesión y el límite diario viven en Archie.
// v3: ARK combina Experiencias + Negocios y lee el modo del usuario (lifestyle/business/both).
import { NextResponse } from "next/server";
import { gql } from "@/lib/archie/gql";
import { getSession } from "@/lib/archie/server";

const MODELS = {
  default: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  quick: process.env.ANTHROPIC_MODEL_QUICK || "claude-haiku-4-5-20251001",
};

const SYSTEM = {
  es: "Eres ARK, el asistente personal de ARK305, la App de la Vida. Cubres dos mundos: EXPERIENCIAS (vida y lujo en Miami — chofer, yate, chef, limpieza, fotos, sesiones de contenido con creadores, talento, ARK Pass) y NEGOCIOS (agentes de IA de voz y chat, automatizaciones, HighLevel, sistemas que venden). Detecta en qué mundo está la persona y combina ambos cuando tenga sentido: muchos quieren vivir la experiencia Y montar el negocio (ej. un día de grabación en yate + su propio agente de IA). Pon siempre el contenido correcto según el escenario, sin mezclar de forma confusa. Hablas español con calidez premium, estilo Apple: claro, breve, sin relleno. No inventes precios ni disponibilidad; si no sabes algo, dilo.",
  en: "You are ARK, the personal assistant of ARK305, the Life App. You cover two worlds: EXPERIENCES (life and luxury in Miami — driver, yacht, chef, cleaning, photos, content sessions with creators, talent, ARK Pass) and BUSINESS (voice and chat AI agents, automations, HighLevel, systems that sell). Detect which world the person is in and combine both when it makes sense: many want to live the experience AND build the business (e.g. a content day on a yacht + their own AI agent). Always put the right content in place for each scenario, without confusing the two. You speak English with premium warmth, Apple-like style: clear, brief, no fluff. Never invent prices or availability; if you don't know something, say so.",
};

export async function POST(req: Request) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });

  // 1. Solo usuarios con sesión de Archie (cookie verificada con las llaves públicas de Archie).
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "es";

  // 2. Límite diario por persona (columnas ai_day y ai_count del member) y su modo.
  const limit = parseInt(process.env.AI_DAILY_LIMIT || "60", 10);
  let modeLine = "";
  try {
    const { member } = await gql<{ member: { items: { id: string; experience: string | null; aiDay: string | null; aiCount: number | null }[] } }>(
      `query($a: String) { member(first: 1, filter: { authId: { equals: $a } }) { items { id experience aiDay aiCount } } }`,
      { a: session.userId },
      session.token,
    );
    const row = member.items[0];
    if (!row) return NextResponse.json({ error: "profile" }, { status: 403 });
    const today = new Date().toISOString().slice(0, 10);
    const used = row.aiDay?.slice(0, 10) === today ? (row.aiCount ?? 0) : 0;
    if (used >= limit) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    await gql(`mutation($id: String, $in: MemberUpdateInput!) { updateMember(id: $id, input: $in) { id } }`, { id: row.id, in: { aiDay: today, aiCount: used + 1 } }, session.token);
    const exp = row.experience;
    if (exp === "lifestyle" || exp === "business" || exp === "both") {
      modeLine = locale === "en" ? ` The user is in ${exp} mode.` : ` El usuario está en modo: ${exp}.`;
    }
  } catch (e) {
    // Si Archie no responde, no llamamos a la IA: así el límite nunca se salta.
    console.error("archie ai limit", e);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  // 3. Llamar a Claude
  const prompt = String(body.prompt || "").slice(0, 60000);
  if (!prompt) return NextResponse.json({ error: "prompt" }, { status: 400 });
  const system =
    SYSTEM[locale] +
    modeLine +
    (body.json ? " Respond ONLY with valid JSON, no extra text or code blocks." : "");

  const r = await fetch("https://api.anthropic.com/v1/messages", {
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
  });
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
  return NextResponse.json({ text, user: session.userId });
}
