"use client";

// Llama a ARK IA (POST /api/ai) con la sesión de la persona.
// Devuelve null si no hay sesión, si la IA no está configurada o si algo falla:
// la pantalla sigue con su versión sin IA.
import type { Locale } from "./locale";
import { createClient } from "./supabase/client";
import { supabaseReady } from "./supabase/config";

export type AiResult = { ok: true; text: string } | { ok: false; reason: "signin" | "limit" | "error" };

export async function askArk(prompt: string, opts: { locale: Locale; json?: boolean; tier?: "default" | "quick" }): Promise<AiResult> {
  if (!supabaseReady) return { ok: false, reason: "signin" };
  try {
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, reason: "signin" };
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt, locale: opts.locale, json: !!opts.json, tier: opts.tier ?? "default" }),
    });
    if (r.status === 401) return { ok: false, reason: "signin" };
    if (r.status === 429) return { ok: false, reason: "limit" };
    if (!r.ok) return { ok: false, reason: "error" };
    const body = (await r.json()) as { text?: string };
    return body.text ? { ok: true, text: body.text } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}
