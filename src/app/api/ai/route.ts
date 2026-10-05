// POST /api/ai — Asistente IA de ARK305 (Claude).
// La llave de Anthropic vive solo aquí, en el servidor. Nunca llega al navegador.
import { NextResponse } from "next/server";

const MODELS = {
  default: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  quick: process.env.ANTHROPIC_MODEL_QUICK || "claude-haiku-4-5-20251001",
};

const SYSTEM = {
  es: "Eres ARK, el asistente personal de ARK305, la App de la Vida: servicios y experiencias de lujo en Miami (chofer, yate, chef, limpieza, fotos, talento). Hablas español con calidez premium, estilo Apple: claro, breve, sin relleno. Ayudas a planear el día, recomendar servicios y resolver dudas. No inventes precios ni disponibilidad; si no sabes algo, dilo.",
  en: "You are ARK, the personal assistant of ARK305, the Life App: luxury services and experiences in Miami (driver, yacht, chef, cleaning, photos, talent). You speak English with premium warmth, Apple-like style: clear, brief, no fluff. You help plan the day, recommend services, and answer questions. Never invent prices or availability; if you don't know something, say so.",
};

export async function POST(req: Request) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });

  // 1. Solo usuarios con sesión
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !SUPABASE_URL || !SUPABASE_KEY)
    return NextResponse.json({ error: "auth" }, { status: 401 });
  const me = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!me.ok) return NextResponse.json({ error: "auth" }, { status: 401 });
  const who = await me.json();

  // 2. Límite diario por persona
  const limit = parseInt(process.env.AI_DAILY_LIMIT || "60", 10);
  const bump = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bump_ai`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lim: limit }),
  });
  if (bump.ok && (await bump.json()) === false)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  // 3. Llamar a Claude
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "").slice(0, 60000);
  if (!prompt) return NextResponse.json({ error: "prompt" }, { status: 400 });
  const locale = body.locale === "en" ? "en" : "es";
  const system =
    SYSTEM[locale] + (body.json ? " Respond ONLY with valid JSON, no extra text or code blocks." : "");

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
  return NextResponse.json({ text, user: who.id });
}
