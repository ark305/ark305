"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { entryPrice, getItem, packages, planSummary, type Plan } from "@/lib/catalog";
import { requestDayPlan, type DayProvenance } from "@/lib/day-ai";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";
import { day, plannerGuests, useDay, usePlannerGuests } from "@/lib/day-store";
import { dict, formatTime } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { IconClose, IconPeople, IconSparkle } from "./icons";
import { useToast } from "./toast";
import { DayRequests } from "./day-requests";

const TEAL = "#7FC2B7";

// Meta proposes a plan; adding it to the draft does not submit service requests.
export function DayPlanner({ locale, initialPrompt = "" }: { locale: Locale; discount: number; levelName: string; initialPrompt?: string }) {
  const t = dict(locale).day;
  const money = (n: number) => formatPrice(n, locale);
  const { show } = useToast();
  const entries = useDay();

  const [text, setText] = useState(initialPrompt);
  const guests = usePlannerGuests();
  const [building, setBuilding] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [provenance, setProvenance] = useState<DayProvenance | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const requestActive = useRef(false);
  const dayRef = useRef<HTMLElement>(null);

  async function build(prompt = text) {
    if (requestActive.current) return;
    if (!prompt.trim()) return show(t.needText);
    setText(prompt);
    setPlan(null);
    setProvenance(null);
    setAiError(null);
    if (!supabaseReady) { setAiError(t.aiUnavailable); return; }
    requestActive.current = true;
    setBuilding(true);
    try {
      const { data, error } = await createClient().auth.getSession();
      if (error || !data.session) throw new Error("auth");
      const result = await requestDayPlan({ prompt, guests, locale }, data.session.access_token);
      plannerGuests.set(result.plan.guests);
      setPlan(result.plan);
      setProvenance(result.provenance);
    } catch (error) {
      const code = error instanceof Error ? error.message : "upstream";
      setAiError(code === "auth" ? t.aiSignIn : code === "rate_limited" ? t.aiLimit : t.aiError);
    } finally {
      requestActive.current = false;
      setBuilding(false);
    }
  }

  function addToDay(items: Plan["items"]) {
    day.add(items);
    setPlan(null);
    show(dict(locale).feed.added);
    setTimeout(() => dayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const planTotal = plan ? plan.items.reduce((s, i) => s + entryPrice({ ...i, uid: "" }), 0) : 0;

  return (
    <div className="flex flex-col gap-8 px-4 pt-8">
      <header>
        <h1 className="font-display text-[40px] leading-[1.02] font-semibold text-white">{t.title}</h1>
        <p className="mt-3 text-base leading-normal text-mute">{t.sub}</p>
      </header>

      {/* ARK IA */}
      <section
        className="flex flex-col gap-3.5 rounded-[28px] border p-4"
        style={{ borderColor: `${TEAL}40`, background: `radial-gradient(120% 90% at 50% 0%, ${TEAL}30 0%, ${TEAL}0d 50%, #0b0c0f 100%)`, boxShadow: `0 30px 80px -40px ${TEAL}99` }}
      >
        <label htmlFor="ark-ai" className="flex items-center gap-2 text-sm font-bold text-teal">
          <IconSparkle size={18} stroke={TEAL} weight={1.9} /> {t.aiLabel}
        </label>
        <textarea
          id="ark-ai"
          rows={2}
          maxLength={4000}
          disabled={building}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              build();
            }
          }}
          placeholder={t.placeholder}
          className="resize-none rounded-[18px] border border-white/10 bg-ink/60 px-4 py-3 text-base leading-snug text-cream outline-none placeholder:text-mute focus:border-teal/60"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-cream/80">
            <IconPeople size={18} stroke="#EFE6D8" />
            <span className="sr-only">{t.people}</span>
            <button type="button" aria-label="−" onClick={() => plannerGuests.set(Math.max(1, guests - 1))} className="flex size-8 items-center justify-center rounded-full bg-white/10 text-lg">
              −
            </button>
            <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">
              {guests}
            </span>
            <button type="button" aria-label="+" onClick={() => plannerGuests.set(Math.min(20, guests + 1))} className="flex size-8 items-center justify-center rounded-full bg-white/10 text-lg">
              +
            </button>
          </div>
          <button type="button" onClick={() => build()} disabled={building} className="h-11 rounded-full px-5 text-[15px] font-bold text-ink disabled:opacity-70" style={{ background: TEAL }}>
            {building ? t.building : t.build}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {t.suggestions.map((s) => (
            <button key={s} type="button" disabled={building} onClick={() => build(s)} className="h-9 shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-cream">
              {s}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-mute">{t.aiPreview}</p>
        {!supabaseReady && <p role="status" className="text-sm text-cream">{t.aiUnavailable}</p>}
        {aiError && <p role="alert" className="text-sm text-cream">{aiError}{aiError === t.aiSignIn && <a href="/entrar" className="ml-2 underline">{t.aiLogin}</a>}</p>}
      </section>

      {/* Propuesta de ARK IA */}
      {plan && (
        <section className="flex flex-col gap-3 rounded-[26px] border border-teal-line bg-teal-deep/40 p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-teal uppercase">{t.proposal}</p>
          <p className="rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep px-3.5 py-3 text-[15px] leading-normal text-cream">{plan.items.length ? planSummary(plan, locale) : t.aiNoMatch}</p>
          {provenance && <p className="break-all text-xs text-mute">{provenance.provider} · {provenance.model} · {provenance.responseId}</p>}
          <p className="text-xs text-mute">{t.aiEstimate}</p>
          <ul className="flex flex-col gap-2">
            {plan.items.map((i) => {
              const c = getItem(i.id)!;
              return (
                <li key={i.id} className="flex items-center gap-3">
                  <span className="w-[68px] shrink-0 text-sm font-semibold text-cream/80 tabular-nums">{formatTime(i.time, locale)}</span>
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-xl">
                    <Image src={c.photo} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="grow text-[15px] font-semibold text-white">{c.name[locale]}</span>
                  <span className="text-sm text-cream/70 tabular-nums">{money(entryPrice({ ...i, uid: "" }))}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[15px] font-bold text-white">
            <span>{t.total}</span>
            <span className="tabular-nums">{money(planTotal)}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!plan.items.length} onClick={() => addToDay(plan.items)} className="h-11 grow rounded-full text-[15px] font-bold text-ink disabled:opacity-50" style={{ background: TEAL }}>
              {t.addPlan}
            </button>
            <button type="button" onClick={() => setPlan(null)} className="h-11 rounded-full border border-white/15 px-4 text-sm text-cream">
              {t.discard}
            </button>
          </div>
        </section>
      )}

      {/* Días armados */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{t.packsTitle}</h2>
          <p className="text-sm text-mute">{t.packsSub}</p>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4">
          {packages.map((p) => {
            const items = p.items.map((i) => ({ ...i, guests }));
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addToDay(items)}
                className="relative flex h-[230px] w-[72%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[24px] p-4 text-left"
              >
                <Image src={p.photo} alt="" fill sizes="300px" className="object-cover" />
                <div className="fade-bottom absolute inset-0" />
                <span className="relative text-xl font-bold text-white">{p.name[locale]}</span>
                <span className="relative mt-0.5 text-[13px] leading-snug text-cream/75">{t.packageDisclaimer}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tu día */}
      <section ref={dayRef} className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold text-white">{t.yourDay}</h2>
        <p className="text-xs leading-relaxed text-mute">{t.draftNote}</p>
        {entries.length === 0 ? (
          <p className="rounded-[22px] border border-dashed border-white/15 px-5 py-8 text-center text-[15px] text-mute">{t.empty}</p>
        ) : (
          <>
            <ol className="relative flex flex-col gap-3 before:absolute before:top-6 before:bottom-6 before:left-[4px] before:w-px before:bg-white/15">
              {entries.map((e) => {
                const c = getItem(e.id);
                if (!c) return null;
                const detail = c.unit === "h" ? t.hours(e.qty) : c.unit === "p" ? t.persons(e.guests) : null;
                return (
                  <li key={e.uid} className="relative flex items-center pl-5">
                    <span className="gold-grad absolute top-1/2 left-0 size-[9px] -translate-y-1/2 rounded-full ring-4 ring-ink" />
                    <div className="flex min-w-0 grow items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.035] p-2.5">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-[14px]">
                        <Image src={c.photo} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span className="flex min-w-0 grow flex-col">
                        <span className="text-[12px] font-semibold text-gold-soft tabular-nums">
                          {formatTime(e.time, locale)}
                          {detail ? ` · ${detail}` : ""}
                        </span>
                        <span className="truncate text-[15px] font-bold text-white">{c.name[locale]}</span>
                        <span className="truncate text-[12px] text-mute">{t.requestDatePrompt}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <button type="button" aria-label={t.remove} onClick={() => day.remove(e.uid)} className="flex size-7 items-center justify-center rounded-full bg-white/[0.07]">
                          <IconClose size={13} stroke="#9A9EA6" />
                        </button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

          </>
        )}
      </section>
      <DayRequests locale={locale} entries={entries} />
    </div>
  );
}
