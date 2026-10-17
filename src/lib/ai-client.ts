// Llama a ARK IA en vivo (/api/ai/assist). Devuelve null si no hay IA y la pantalla usa su vista previa.
export async function askArk<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const r = await fetch("/api/ai/assist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await r.json();
    return r.ok && !data.fallback ? (data as T) : null;
  } catch {
    return null;
  }
}
