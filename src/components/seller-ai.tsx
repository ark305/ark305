"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { requestSellerDraft, type SellerResult, type SellerInput } from "@/lib/seller-draft-ai";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";
import { useToast } from "./toast";

export function SellerAi({ locale, userId, services, tone = "lifestyle" }: {
  locale: Locale; userId: string | null; services: { id: string; title: string }[]; tone?: "lifestyle" | "business";
}) {
  const base = dict(locale).panel, es = locale === "es";
  const actions = tone === "business" ? dict(locale).biz.panel.aiActions : base.aiActions;
  const { show } = useToast();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [context, setContext] = useState("");
  const [message, setMessage] = useState("");
  const [cost, setCost] = useState("");
  const [margin, setMargin] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionMatches, setSessionMatches] = useState(Boolean(userId));
  const [out, setOut] = useState<SellerResult | null>(null);
  const [error, setError] = useState("");
  const active = useRef(false), generation = useRef(0);
  const selected = services.find(s => s.id === serviceId) ?? services[0];
  const signIn = es ? "Inicia sesión para usar tus servicios." : "Sign in to use your services.";
  useEffect(() => {
    if (!supabaseReady) return;
    const requestActive = active, requestGeneration = generation;
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      const matches = Boolean(userId && session?.user.id === userId);
      setSessionMatches(matches);
      if (event === "SIGNED_OUT" || !matches) {
        requestGeneration.current++; requestActive.current = false; setBusy(false); setOut(null);
      }
    });
    return () => { requestGeneration.current++; requestActive.current = false; data.subscription.unsubscribe(); };
  }, [userId]);

  async function run(action: SellerInput["action"]) {
    if (active.current || !selected) return;
    if (!sessionMatches || !supabaseReady) { setError(signIn); return; }
    if (action === "reply" && !message.trim()) { setError(es ? "Escribe el mensaje del cliente." : "Enter the customer's message."); return; }
    if (action === "price" && (!cost.trim() || !margin.trim() || !Number.isFinite(Number(cost)) || Number(cost) < 0.01 || Number(cost) > 1000000 ||
      !Number.isFinite(Number(margin)) || Number(margin) < 0 || Number(margin) > 95)) {
      setError(es ? "Ingresa un costo entre 0,01 y 1.000.000 USD y un margen entre 0 y 95%." : "Enter a cost from 0.01 to 1,000,000 USD and a margin from 0 to 95%."); return;
    }
    active.current = true; const operation = ++generation.current;
    setBusy(true); setOut(null); setError("");
    try {
      const { data, error: sessionError } = await createClient().auth.getSession();
      if (operation !== generation.current) return;
      if (sessionError || !data.session?.access_token || data.session.user.id !== userId) throw new Error("auth");
      const result = await requestSellerDraft({ action, serviceId: selected.id, locale, tone, context,
        ...(action === "reply" ? { customerMessage: message.trim() } : {}),
        ...(action === "price" ? { cost: Number(cost), marginPercent: Number(margin) } : {}),
      }, data.session.access_token);
      if (operation === generation.current) setOut(result);
    } catch (cause) {
      if (operation !== generation.current) return;
      const code = cause instanceof Error ? cause.message : "";
      setError(code === "auth" ? signIn : code === "seller_service" ?
        (es ? "El servicio ya no está disponible en tu perfil. Actualiza la página." : "This service is no longer available in your profile. Refresh the page.") :
        code === "rate_limited" ? (es ? "Alcanzaste el límite de IA. Intenta más tarde." : "AI limit reached. Try again later.") :
        (es ? "No se obtuvo un borrador válido de Meta. Intenta nuevamente." : "Could not obtain a valid draft from Meta. Try again."));
    } finally { if (operation === generation.current) { active.current = false; setBusy(false); } }
  }
  async function copy() {
    if (!out || !sessionMatches) return;
    try { await navigator.clipboard.writeText(out.draft.text); show(base.copied); }
    catch { show(dict(locale).common.copyFailed); }
  }
  const field = "w-full rounded-xl border border-white/15 bg-ink p-3 text-sm text-cream";
  return <section className="flex flex-col gap-3 rounded-[26px] border border-teal/25 p-4">
    <h2 className="text-lg font-bold text-white">{base.aiTitle}</h2>
    <p className="text-xs text-mute">{es ? "Borradores con Meta basados en tus servicios. Revisa antes de copiar: nada se publica ni se envía automáticamente." : "Meta drafts based on your services. Review before copying: nothing is published or sent automatically."}</p>
    {!sessionMatches || !selected ? <Link href={!sessionMatches ? "/entrar?next=%2Fpanel" : "/perfil/editar"} className="text-teal">
      {!sessionMatches ? signIn : base.needService}
    </Link> : <>
      <label className="text-sm text-cream">{es ? "Servicio" : "Service"}
        <select aria-label={es ? "Servicio" : "Service"} value={selected.id} disabled={busy} onChange={e => { setServiceId(e.target.value); setOut(null); }} className={field}>
          {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>
      <label className="text-sm text-cream">{es ? "Objetivo o contexto (opcional)" : "Goal or context (optional)"}
        <textarea className={field} value={context} maxLength={2000} disabled={busy} onChange={e => { setContext(e.target.value); setOut(null); }} />
      </label>
      <label className="text-sm text-cream">{es ? "Mensaje del cliente (para responder)" : "Customer message (for replies)"}
        <textarea className={field} value={message} maxLength={2000} disabled={busy} onChange={e => { setMessage(e.target.value); setOut(null); }} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-mute">{es ? "Costo total estimado (USD)" : "Estimated total cost (USD)"}
          <input className={field} type="number" min="0.01" max="1000000" step="0.01" value={cost} disabled={busy} onChange={e => { setCost(e.target.value); setOut(null); }} />
        </label>
        <label className="text-xs text-mute">{es ? "Margen bruto objetivo (%)" : "Target gross margin (%)"}
          <input className={field} type="number" min="0" max="95" step="0.1" value={margin} disabled={busy} onChange={e => { setMargin(e.target.value); setOut(null); }} />
        </label>
      </div>
      <p className="text-xs text-mute">{es ? "Precio = costo ÷ (1 − margen/100). No es un precio de mercado; incluye en el costo los gastos que conozcas." : "Price = cost ÷ (1 − margin/100). This is not a market price; include known expenses in the cost."}</p>
      <div className="flex flex-wrap gap-2">{(["post", "reply", "price"] as const).map(action =>
        <button key={action} type="button" disabled={busy} onClick={() => void run(action)} className="rounded-full border border-teal/30 px-3 py-2 text-sm text-teal disabled:opacity-50">
          {actions[action]}
        </button>)}</div>
    </>}
    {busy && <p role="status" className="text-sm text-mute">{es ? "Meta está preparando tu borrador…" : "Meta is preparing your draft…"}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {out && sessionMatches && <div className="flex flex-col gap-2 rounded-xl bg-teal-deep p-3 text-cream" aria-live="polite">
      <p className="whitespace-pre-wrap">{out.draft.text}</p>
      {out.pricing && <p className="font-bold">{es ? "Precio calculado orientativo" : "Indicative calculated price"}: {out.pricing.suggestedPrice.toFixed(2)} USD</p>}
      <p className="break-all text-xs text-mute">Meta · {out.provenance.model} · {out.provenance.responseId}</p>
      <button type="button" onClick={() => void copy()} className="self-end text-sm text-teal">{base.copy}</button>
    </div>}
  </section>;
}
