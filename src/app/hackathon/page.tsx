"use client";

/*
 * HACKATHON SCAFFOLD — eMerge AI Hackathon 2026 (branch: hackathon-emerge-2026)
 * One-screen demo: ONE input → ONE output → ONE action. NOT production code.
 * Do not merge to main. Claude Code owns production code; this branch is the
 * hackathon sandbox.
 *
 * Fallback strategy (every live dependency has a demo-mode fallback):
 *  - ?demo=1 in the URL, or the "Modo demo" toggle → canned plan, zero network.
 *  - Any /api/ai failure (401 sin sesión, 503 sin llave, timeout 8s, sin wifi)
 *    → auto-fallback to the canned plan with a "modo demo" badge.
 * The judges always see a working screen, with or without the network.
 */

import { useCallback, useEffect, useState } from "react";

type PlanStop = { time: string; title: string; detail: string };
type Plan = { headline: string; stops: PlanStop[]; total: string; source: "ai" | "demo" };

const DEMO_PLAN: Plan = {
  headline: "Yate y cena para 6 — este sábado",
  stops: [
    { time: "4:00 PM", title: "Chofer privado", detail: "Recogida en tu ubicación · SUV premium" },
    { time: "5:00 PM", title: "Yate · 2 horas", detail: "Salida desde Bayside Marina · capitán incluido" },
    { time: "8:00 PM", title: "Cena con chef privado", detail: "Menú de 3 tiempos a bordo o en tu casa" },
    { time: "10:30 PM", title: "Regreso", detail: "Chofer de vuelta · fin del plan" },
  ],
  total: "Desde $1,450 · 6 personas",
  source: "demo",
};

const DEMO_PROMPT = "Yate y cena para 6 este sábado";

export default function HackathonDemoPage() {
  const [prompt, setPrompt] = useState(DEMO_PROMPT);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1") {
      setDemoMode(true);
    }
  }, []);

  const runDemo = useCallback(async () => {
    setLoading(true);
    setConfirmed(false);
    setPlan(null);
    // Live path: one real Claude action through /api/ai (needs Supabase session).
    // Anything goes wrong → instant fallback to the canned plan. No exceptions.
    if (!demoMode) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, locale: "es", demo: true }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const text: string | undefined = data?.text || data?.reply || data?.message;
          if (text) {
            setPlan({ headline: prompt, stops: [{ time: "Ahora", title: "ARK AI", detail: text.slice(0, 280) }], total: "Plan generado por ARK AI", source: "ai" });
            setLoading(false);
            return;
          }
        }
      } catch {
        // fall through to demo mode
      }
    }
    // Demo-mode fallback: guaranteed working plan, zero network.
    await new Promise((r) => setTimeout(r, 600)); // beat for the reveal
    setPlan(DEMO_PLAN);
    setLoading(false);
  }, [prompt, demoMode]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0c",
        color: "#f5f5f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <p style={{ fontSize: 11, letterSpacing: 3, color: "#8e8e93", margin: "0 0 8px" }}>ARK305 · HACKATHON DEMO</p>
        <h1 style={{ fontSize: 34, fontWeight: 700, margin: "0 0 6px", letterSpacing: -0.5 }}>
          Pide tu noche. <span style={{ color: "#8e8e93" }}>La IA la arma.</span>
        </h1>
        <p style={{ color: "#a1a1a6", fontSize: 15, margin: "0 0 24px" }}>
          LinkedIn meets Uber, combinado por IA: talento + servicios de Miami en un plan.
        </p>

        <label style={{ display: "block", fontSize: 12, color: "#8e8e93", marginBottom: 8 }}>¿Qué quieres hacer?</label>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Yate y cena para 6 este sábado"
          style={{
            width: "100%",
            background: "#1c1c1e",
            border: "1px solid #2c2c2e",
            borderRadius: 14,
            padding: "16px 18px",
            fontSize: 17,
            color: "#f5f5f7",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={runDemo}
          disabled={loading || !prompt.trim()}
          style={{
            marginTop: 12,
            width: "100%",
            background: "#f5f5f7",
            color: "#0a0a0c",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            fontSize: 17,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !prompt.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Armando tu plan…" : "Armar mi plan"}
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13, color: "#8e8e93", cursor: "pointer" }}>
          <input type="checkbox" checked={demoMode} onChange={(e) => setDemoMode(e.target.checked)} />
          Modo demo (funciona sin internet ni sesión)
        </label>

        {plan && (
          <div
            style={{
              marginTop: 20,
              background: "#1c1c1e",
              border: "1px solid #2c2c2e",
              borderRadius: 18,
              padding: 22,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{plan.headline}</h2>
              {plan.source === "demo" && (
                <span style={{ fontSize: 11, background: "#2c2c2e", color: "#a1a1a6", padding: "4px 10px", borderRadius: 999 }}>
                  modo demo
                </span>
              )}
            </div>
            {plan.stops.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "10px 0", borderTop: i ? "1px solid #2c2c2e" : "none" }}>
                <div style={{ fontSize: 13, color: "#8e8e93", minWidth: 64, paddingTop: 2 }}>{s.time}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#a1a1a6" }}>{s.detail}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, fontSize: 14, color: "#a1a1a6" }}>{plan.total}</div>
            {!confirmed ? (
              <button
                onClick={() => setConfirmed(true)}
                style={{
                  marginTop: 14,
                  width: "100%",
                  background: "transparent",
                  color: "#f5f5f7",
                  border: "1px solid #f5f5f7",
                  borderRadius: 14,
                  padding: "14px",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirmar plan
              </button>
            ) : (
              <div style={{ marginTop: 14, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#30d158" }}>
                ✓ Plan confirmado — nos vemos el sábado
              </div>
            )}
          </div>
        )}

        <p style={{ marginTop: 28, fontSize: 11, color: "#48484a", textAlign: "center" }}>
          Scaffold del hackathon eMerge 2026 · rama hackathon-emerge-2026 · no es código de producción
        </p>
      </div>
    </main>
  );
}
