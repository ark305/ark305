// Proveedor de IA de ARK (solo servidor). Claude por defecto; Meta (Muse) si AI_PROVIDER=meta.
// Las llaves viven solo aquí, en el servidor. Nunca llegan al navegador.
import "server-only";

export type AiProvider = "anthropic" | "meta";

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function aiProvider(): AiProvider | null {
  const want = process.env.AI_PROVIDER === "meta" ? "meta" : "anthropic";
  if (want === "meta" && process.env.MODEL_API_KEY) return "meta";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return process.env.MODEL_API_KEY ? "meta" : null;
}

type Ask = { system: string; prompt: string; maxTokens: number; quick?: boolean; timeoutMs?: number };

async function anthropic({ system, prompt, maxTokens, quick, timeoutMs }: Ask) {
  const model = quick
    ? process.env.ANTHROPIC_MODEL_QUICK || "claude-haiku-4-5-20251001"
    : process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }),
    signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
  });
  if (!r.ok) throw new AiError(r.status, `anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  return (data.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n");
}

// Meta Responses API (POST /v1/responses).
async function meta({ system, prompt, maxTokens, timeoutMs }: Ask) {
  const r = await fetch(process.env.META_API_URL || "https://api.meta.ai/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.META_MODEL || "muse-wonder-1.0",
      instructions: system,
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      max_output_tokens: maxTokens,
      stream: false,
    }),
    signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
  });
  if (!r.ok) throw new AiError(r.status, `meta ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  if (typeof data.output_text === "string") return data.output_text;
  type Part = { type?: string; text?: string };
  return ((data.output || []) as { content?: Part[] }[])
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === "output_text" || typeof c.text === "string")
    .map((c) => c.text ?? "")
    .join("\n");
}

export async function complete(ask: Ask): Promise<{ text: string; provider: AiProvider }> {
  const provider = aiProvider();
  if (!provider) throw new AiError(503, "ai_not_configured");
  const text = provider === "meta" ? await meta(ask) : await anthropic(ask);
  return { text, provider };
}
