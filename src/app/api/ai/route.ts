// POST /api/ai — Asistente IA de ARK305 (Meta Muse Spark).
// La llave de Meta vive solo aquí, en el servidor. Nunca llega al navegador.
// v3: ARK combina Experiencias + Negocios y lee el modo del usuario (lifestyle/business/both).
import { NextResponse } from "next/server";
import { dayPlanInstructions, dayPlanSchema, parseDayPlan } from "@/lib/day-ai";
import { buildDiagnosisMessages, buildDiagnosisResponseSchema, parseDiagnosisModelResponse, parseDiagnosisTurnInput } from "@/lib/diagnosis-ai-server";
import { diagnosisOutputIssue } from "@/lib/diagnosis-ai";

const MODELS = {
  default: process.env.META_MODEL || "muse-spark-1.3",
  quick: process.env.META_MODEL_QUICK || process.env.META_MODEL || "muse-spark-1.3",
};

const SYSTEM = {
  es: "Eres ARK, el asistente personal de ARK305, la App de la Vida. Cubres dos mundos: EXPERIENCIAS (vida y lujo en Miami — chofer, yate, chef, limpieza, fotos, sesiones de contenido con creadores, talento, ARK Pass) y NEGOCIOS (agentes de IA de voz y chat, automatizaciones, HighLevel, sistemas que venden). Detecta en qué mundo está la persona y combina ambos cuando tenga sentido: muchos quieren vivir la experiencia Y montar el negocio (ej. un día de grabación en yate + su propio agente de IA). Pon siempre el contenido correcto según el escenario, sin mezclar de forma confusa. Hablas español con calidez premium, estilo Apple: claro, breve, sin relleno. No inventes precios ni disponibilidad; si no sabes algo, dilo.",
  en: "You are ARK, the personal assistant of ARK305, the Life App. You cover two worlds: EXPERIENCES (life and luxury in Miami — driver, yacht, chef, cleaning, photos, content sessions with creators, talent, ARK Pass) and BUSINESS (voice and chat AI agents, automations, HighLevel, systems that sell). Detect which world the person is in and combine both when it makes sense: many want to live the experience AND build the business (e.g. a content day on a yacht + their own AI agent). Always put the right content in place for each scenario, without confusing the two. You speak English with premium warmth, Apple-like style: clear, brief, no fluff. Never invent prices or availability; if you don't know something, say so.",
};

export async function POST(req: Request) {
  const META_API_KEY = process.env.META_API_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!META_API_KEY) return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });

  // 1. Solo usuarios con sesión
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !SUPABASE_URL || !SUPABASE_KEY)
    return NextResponse.json({ error: "auth" }, { status: 401 });
  const me = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!me.ok) return NextResponse.json({ error: "auth" }, { status: 401 });
  const who = await me.json();

  const body = await req.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "es";
  const dayTask = body.task === "day-plan";
  const diagnosisTask = body.task === "diagnosis";
  const diagnosisInput = diagnosisTask ? parseDiagnosisTurnInput(body) : null;
  if (diagnosisTask && !diagnosisInput) return NextResponse.json({ error: "diagnosis_input" }, { status: 400 });
  if (dayTask && (typeof body.prompt !== "string" || !body.prompt.trim() || body.prompt.length > 4000 ||
      !Number.isInteger(body.guests) || body.guests < 1 || body.guests > 20)) {
    return NextResponse.json({ error: "prompt" }, { status: 400 });
  }
  const baseUrl = (process.env.META_BASE_URL || "https://api.meta.ai").replace(/\/$/, "");
  if ((dayTask || diagnosisTask) && baseUrl !== "https://api.meta.ai") {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

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
  if (dayTask || diagnosisTask) {
    const allowed = bump.ok ? await bump.json().catch(() => null) : null;
    if (allowed !== true) return NextResponse.json({ error: allowed === false ? "rate_limited" : "quota_unavailable" },
      { status: allowed === false ? 429 : 503 });
  } else if (bump.ok && (await bump.json()) === false)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  // 2b. Modo del usuario: lifestyle / business / both (si su perfil lo tiene)
  let modeLine = "";
  try {
    const prof = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=experience&id=eq.${who.id}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
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

  // 3. Llamar a Meta Muse Spark
  const prompt = String(body.prompt || "").slice(0, 60000);
  if (!diagnosisTask && !prompt) return NextResponse.json({ error: "prompt" }, { status: 400 });
  const diagnosisContext = diagnosisInput ? buildDiagnosisMessages(diagnosisInput) : null;
  const system = diagnosisContext
    ? diagnosisContext.system + modeLine
    :
    SYSTEM[locale] +
    modeLine +
    (dayTask ? `\n${dayPlanInstructions}\nRequested guests: ${body.guests}.` :
      body.json ? " Respond ONLY with valid JSON, no extra text or code blocks." : "");
  const diagnosisMessages = diagnosisContext?.messages ?? null;

  const r = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    ...(dayTask || diagnosisTask ? { signal: AbortSignal.timeout(60000), redirect: "error" as const } : {}),
    headers: {
      Authorization: `Bearer ${META_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: body.tier === "quick" ? MODELS.quick : MODELS.default,
      max_tokens: diagnosisTask ? 4096 : 1500,
      ...(dayTask ? { output_config: { format: { type: "json_schema", schema: dayPlanSchema } } } : {}),
      ...(diagnosisTask ? { output_config: { effort: "low", format: { type: "json_schema", schema: buildDiagnosisResponseSchema(diagnosisInput!.answers) } } } : {}),
      system,
      messages: diagnosisMessages ?? [{ role: "user", content: prompt }],
    }),
  }).catch((error) => { if (!dayTask && !diagnosisTask) throw error; return null; });
  if (!r) return NextResponse.json({ error: "upstream" }, { status: 502 });
  if (r.status === 429) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  if (!r.ok) {
    console.error("meta", r.status);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
  const data = await r.json().catch((error) => { if (!dayTask && !diagnosisTask) throw error; return null; });
  if (diagnosisTask) {
    const invalidDiagnosis = (reason: string) => NextResponse.json(
      { error: "invalid_diagnosis", reason }, { status: 502, headers: { "Cache-Control": "no-store" } });
    if (data?.stop_reason === "max_tokens") return invalidDiagnosis("truncated");
    if (!data || data.stop_reason !== "end_turn" || typeof data.model !== "string" || !data.model ||
        typeof data.id !== "string" || !data.id || !Array.isArray(data.content)) {
      return invalidDiagnosis("invalid_metadata");
    }
    try {
      const text = data.content.filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text).join("\n");
      const output: unknown = JSON.parse(text);
      const turn = parseDiagnosisModelResponse(output, diagnosisInput!.answers);
      if (!turn) {
        console.error("diagnosis_validation", diagnosisOutputIssue(output, diagnosisInput!.answers));
        return invalidDiagnosis("invalid_answers");
      }
      return NextResponse.json({ ...turn, provenance: { provider: "Meta", model: data.model, responseId: data.id } },
        { headers: { "Cache-Control": "no-store" } });
    } catch {
      return invalidDiagnosis("invalid_json");
    }
  }
  if (dayTask) {
    try {
      const text = data.content.filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text).join("\n");
      const plan = parseDayPlan(JSON.parse(text));
      if (!plan || data.stop_reason !== "end_turn" || typeof data.model !== "string" || !data.model ||
          typeof data.id !== "string" || !data.id) throw new Error("Invalid plan");
      return NextResponse.json({ plan, provenance: { provider: "Meta", model: data.model, responseId: data.id } },
        { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ error: "invalid_plan" }, { status: 502 });
    }
  }
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
  return NextResponse.json({ text, user: who.id });
}
