"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { positions } from "@/lib/talent";
import { requestTeamPlan, type TeamResult } from "@/lib/team-plan-ai";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";
import { TeamProposalHistory } from './team-proposal-history';

export function TeamBuilder({ locale, canHire }: { locale: Locale; canHire: boolean }) {
  const b = dict(locale).biz.team;
  const es = locale === "es";
  const money = (n: number) => formatPrice(n, locale);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TeamResult | null>(null);
  const [error, setError] = useState("");
  const active = useRef(false);
  const generation = useRef(0);
  const user = useRef<string | null>(null);

  useEffect(() => {
    if (!supabaseReady) return;
    const requestActive = active;
    const requestGeneration = generation;
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (event === "SIGNED_OUT" || next !== user.current) {
        generation.current++; active.current = false; setBusy(false); setResult(null); setError("");
      }
      user.current = next;
    });
    return () => { requestGeneration.current++; requestActive.current = false; data.subscription.unsubscribe(); };
  }, []);

  async function build(prompt = text) {
    if (active.current || !prompt.trim() || prompt.length > 4000) return;
    active.current = true;
    const operation = ++generation.current;
    setText(prompt); setBusy(true); setResult(null); setError("");
    try {
      if (!supabaseReady) throw new Error("auth");
      const { data, error: sessionError } = await createClient().auth.getSession();
      if (operation !== generation.current) return;
      if (sessionError || !data.session?.access_token) throw new Error("auth");
      user.current = data.session.user.id;
      const value = await requestTeamPlan({ prompt: prompt.trim(), locale }, data.session.access_token);
      if (operation === generation.current) setResult(value);
    } catch (cause) {
      if (operation !== generation.current) return;
      const code = cause instanceof Error ? cause.message : "upstream";
      setError(code === "auth" ? (es ? "Inicia sesión para generar tu propuesta." : "Sign in to generate your proposal.") :
        code === "proposal_storage" ? (es ? "El guardado no está disponible. No se ha generado otra propuesta." : "Storage is unavailable. No new proposal was generated.") :
        code === "rate_limited" ? (es ? "Alcanzaste el límite de IA. Intenta más tarde." : "AI limit reached. Try again later.") :
          (es ? "No se pudo obtener una propuesta válida de Meta. Intenta nuevamente." : "Could not obtain a valid proposal from Meta. Try again."));
    } finally {
      if (operation === generation.current) { active.current = false; setBusy(false); }
    }
  }

  const labels = es ? { monthly: "Mensual recurrente", one_off: "Servicio puntual", quote: "Por cotizar" } :
    { monthly: "Monthly recurring", one_off: "One-off service", quote: "Quote required" };
  return <div className="flex flex-col gap-6 px-4 pt-8">
    <header>
      <span className="text-sm font-bold text-gold">Business</span>
      <h1 className="font-display text-[38px] font-semibold text-white">{b.title}</h1>
      <p className="mt-2 text-mute">{b.sub}</p>
    </header>
    <section className="flex flex-col gap-3 rounded-[24px] border border-gold/30 bg-gold/[0.05] p-4">
      <label htmlFor="brief" className="text-sm font-bold text-gold">{b.label}</label>
      <textarea id="brief" rows={3} maxLength={4000} value={text} onChange={e => setText(e.target.value)} placeholder={b.placeholder}
        className="rounded-[16px] border border-white/10 bg-ink/60 px-4 py-3 text-cream" />
      <button type="button" onClick={() => void build()} disabled={busy || !text.trim()} className="gold-grad h-12 rounded-full font-bold text-ink disabled:opacity-60">
        {busy ? b.building : b.build}
      </button>
      <div className="flex flex-wrap gap-2">{b.suggestions.map(s => <button key={s} type="button" disabled={busy} onClick={() => void build(s)}
        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-cream disabled:opacity-60">{s}</button>)}</div>
      <p className="text-xs text-mute">{es ? "Propuestas generadas con Meta. Los errores no se sustituyen por respuestas simuladas." : "Proposals generated with Meta. Errors are never replaced with simulated answers."}</p>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </section>
    <TeamProposalHistory es={es} disabled={busy} onRestore={value=>{generation.current++;active.current=false;setBusy(false);setText(value.prompt);setError('');setResult({...value,storage:{saved:true,id:value.id}});}} />
    {result && <section className="flex flex-col gap-3 rounded-[24px] border border-white/10 p-4">
      <h2 className="font-bold text-gold">{b.proposal}</h2>
      <p className="text-cream">{result.plan.rationale}</p>
      <p className="break-all text-xs text-mute">Meta · {result.provenance.model} · {result.provenance.responseId}</p>
      <p role={result.storage?.saved?'status':'alert'} className="text-sm text-gold">{result.storage?.saved?(es?'Guardada en tu historial privado.':'Saved to your private history.'):(es?'No se confirmó el guardado. Conserva este texto antes de salir; no se reintentará la generación automáticamente.':'Saving was not confirmed. Keep this text before leaving; generation will not be retried automatically.')}</p>
      {result.plan.items.map(item => {
        const role = positions.find(p => p.id === item.id);
        return <div key={item.id} className="border-t border-white/10 py-2 text-sm text-cream">
          <p className="font-semibold">{item.name ?? role?.name[locale] ?? item.id}</p>
          <p>{labels[item.cadence]} · {item.hours ? item.hours + " " + (item.cadence === "monthly" ? (es ? "h/semana" : "h/week") : "h") : (es ? "1 unidad" : "1 unit")}</p>
          <p>{item.amount === null ? labels.quote : money(item.amount)}</p>
        </div>;
      })}
      {result.plan.understood && <dl className="border-t border-white/20 pt-3 text-cream">
        <dt>{labels.monthly}</dt><dd className="font-bold">{money(result.plan.monthlyTotal)}</dd>
        <dt>{labels.one_off}</dt><dd className="font-bold">{money(result.plan.oneOffTotal)}</dd>
        <dt>{labels.quote}</dt><dd>{result.plan.quoteCount} {es ? "servicio(s), no incluidos en los importes" : "service(s), excluded from totals"}</dd>
      </dl>}
      <p className="text-xs text-mute">{es ? "Precios de demo, orientativos. Mensual por horas = tarifa × horas semanales × 4,33. Puntual = una unidad o las horas indicadas. No confirma disponibilidad, contratación ni contratos." : "Indicative demo prices. Monthly hourly cost = rate × weekly hours × 4.33. One-off = one unit or the stated hours. No availability, hiring or contracts are confirmed."}</p>
      <Link href={canHire ? "/talento" : "/niveles"} className="text-center font-semibold text-gold">
        {canHire ? (es ? "Explorar catálogo de talento" : "Explore talent catalog") : (es ? "Ver niveles" : "View membership levels")}
      </Link>
    </section>}
  </div>;
}
