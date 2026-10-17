"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { askArk } from "@/lib/ai-client";
import { entryPrice, getItem, packages, planDay, planSummary, type Plan } from "@/lib/catalog";
import { day, useDay } from "@/lib/day-store";
import { dict, formatTime } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice, getProfile } from "@/lib/mock-data";
import { IconCheck, IconClose, IconPeople, IconSparkle } from "./icons";
import { SoonButton, useToast } from "./toast";

const TEAL = "#7FC2B7";

// Mi día: ARK IA arma el plan, lo agregas a tu día y lo reservas completo.
export function DayPlanner({ locale, discount, levelName, initialPrompt = "" }: { locale: Locale; discount: number; levelName: string; initialPrompt?: string }) {
  const t = dict(locale).day;
  const m = dict(locale).money;
  const money = (n: number) => formatPrice(n, locale);
  const { show } = useToast();
  const entries = useDay();

  const [text, setText] = useState(initialPrompt);
  const [guests, setGuests] = useState(4);
  const [building, setBuilding] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [booking, setBooking] = useState<{ code: string; step: number } | null>(null);
  const [priority, setPriority] = useState(false);
  const [live, setLive] = useState(false);
  const dayRef = useRef<HTMLElement>(null);

  // La reserva avanza sola, como en el prototipo: Confirmado → … → En curso.
  useEffect(() => {
    if (!booking || booking.step >= t.steps.length - 1) return;
    const id = setTimeout(() => setBooking((b) => b && { ...b, step: b.step + 1 }), 2600);
    return () => clearTimeout(id);
  }, [booking, t.steps.length]);

  function build(prompt = text) {
    if (!prompt.trim()) return show(t.needText);
    setText(prompt);
    setBuilding(true);
    setPlan(null);
    askArk<{ plan: Plan }>({ kind: "day", prompt, guests, locale }).then((r) => {
      const p = r?.plan ?? planDay(prompt, guests);
      setLive(!!r);
      setGuests(p.guests);
      setPlan(p);
      setBuilding(false);
    });
  }

  function addToDay(items: Plan["items"]) {
    day.add(items);
    setPlan(null);
    setBooking(null);
    show(dict(locale).feed.added);
    setTimeout(() => dayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const subtotal = entries.reduce((s, e) => s + entryPrice(e), 0);
  const off = Math.round((subtotal * discount) / 100);
  const fee = Math.round((subtotal - off) * 0.05);
  const total = subtotal - off + fee + (priority ? 49 : 0);
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
            <button type="button" aria-label="−" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="flex size-8 items-center justify-center rounded-full bg-white/10 text-lg">
              −
            </button>
            <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">
              {guests}
            </span>
            <button type="button" aria-label="+" onClick={() => setGuests((g) => Math.min(20, g + 1))} className="flex size-8 items-center justify-center rounded-full bg-white/10 text-lg">
              +
            </button>
          </div>
          <button type="button" onClick={() => build()} disabled={building} className="h-11 rounded-full px-5 text-[15px] font-bold text-ink disabled:opacity-70" style={{ background: TEAL }}>
            {building ? t.building : t.build}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {t.suggestions.map((s) => (
            <button key={s} type="button" onClick={() => build(s)} className="h-9 shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-cream">
              {s}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-mute">{live ? dict(locale).common.aiLive : t.aiPreview}</p>
      </section>

      {/* Propuesta de ARK IA */}
      {plan && (
        <section className="flex flex-col gap-3 rounded-[26px] border border-teal-line bg-teal-deep/40 p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-teal uppercase">{t.proposal}</p>
          <p className="rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep px-3.5 py-3 text-[15px] leading-normal text-cream">{planSummary(plan, locale)}</p>
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
            <button type="button" onClick={() => addToDay(plan.items)} className="h-11 grow rounded-full text-[15px] font-bold text-ink" style={{ background: TEAL }}>
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
            const price = items.reduce((s, i) => s + entryPrice({ ...i, uid: "" }), 0);
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
                <span className="relative mt-0.5 text-[13px] leading-snug text-cream/75">{p.desc[locale]}</span>
                <span className="relative mt-2 text-sm font-bold text-gold-soft">
                  {t.from} {money(price)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tu día */}
      <section ref={dayRef} className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold text-white">{t.yourDay}</h2>
        {entries.length === 0 ? (
          <p className="rounded-[22px] border border-dashed border-white/15 px-5 py-8 text-center text-[15px] text-mute">{t.empty}</p>
        ) : (
          <>
            <ol className="relative flex flex-col gap-3 before:absolute before:top-6 before:bottom-6 before:left-[4px] before:w-px before:bg-white/15">
              {entries.map((e) => {
                const c = getItem(e.id);
                if (!c) return null;
                const who = getProfile(c.provider)?.name ?? "";
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
                        <span className="truncate text-[12px] text-mute">{t.with(who)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-semibold text-cream tabular-nums">{money(entryPrice(e))}</span>
                        {!booking && (
                          <button type="button" aria-label={t.remove} onClick={() => day.remove(e.uid)} className="flex size-7 items-center justify-center rounded-full bg-white/[0.07]">
                            <IconClose size={13} stroke="#9A9EA6" />
                          </button>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-col gap-1.5 rounded-[22px] border border-white/10 bg-white/[0.035] p-4 text-sm">
              <Row label={t.subtotal} value={money(subtotal)} />
              {discount > 0 ? <Row label={t.levelDiscount(levelName, discount)} value={`−${money(off)}`} accent /> : <p className="text-[13px] text-gold-soft">{t.upsell}</p>}
              <Row label={t.concierge} value={money(fee)} />
              <label className="flex items-center justify-between gap-3 py-1 text-cream">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={priority} disabled={!!booking} onChange={(e) => setPriority(e.target.checked)} className="size-4 accent-[var(--accent)]" />
                  {m.priority}
                </span>
                <span className="text-gold-soft tabular-nums">{m.priorityPrice}</span>
              </label>
              <div className="mt-1 flex justify-between border-t border-white/10 pt-2.5 text-base font-bold text-white">
                <span>{t.total}</span>
                <span className="tabular-nums">{money(total)}</span>
              </div>
              <Row label={t.deposit} value={money(Math.round(total * 0.3))} />
            </div>

            {booking ? (
              <BookingTracker locale={locale} code={booking.code} step={booking.step} onReset={() => { day.clear(); setBooking(null); }} />
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setBooking({ code: `ARK-${Math.floor(1000 + Math.random() * 9000)}`, step: 0 })}
                  className="gold-grad h-[52px] rounded-full text-base font-bold text-ink shadow-[0_14px_40px_-16px_var(--accent)]"
                >
                  {t.bookAll}
                </button>
                <SoonButton className="glass h-12 rounded-full text-[15px] font-semibold text-cream">{t.group}</SoonButton>
                <p className="text-center text-[11px] text-mute">{t.demoNote}</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? "text-gold-soft" : "text-mute"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function BookingTracker({ locale, code, step, onReset }: { locale: Locale; code: string; step: number; onReset: () => void }) {
  const t = dict(locale).day;
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-gold/30 bg-gold/[0.06] p-4" role="status" aria-live="polite">
      <p className="text-sm font-bold text-gold-soft">
        {t.booking} {code}
      </p>
      <ol className="flex flex-col gap-2.5">
        {t.steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 text-[15px] transition-opacity ${i <= step ? "opacity-100" : "opacity-35"}`}>
            <span className={`flex size-7 items-center justify-center rounded-full ${i <= step ? "gold-grad" : "border border-white/25"}`}>
              {i <= step && <IconCheck size={15} stroke="#08090B" weight={2.6} />}
            </span>
            <span className={i === step ? "font-bold text-white" : "text-cream/80"}>{s}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-[18px_18px_18px_4px] bg-white/[0.06] px-3.5 py-3">
        <p className="text-xs font-bold text-gold-soft">{t.conciergeName}</p>
        <p className="mt-0.5 text-[15px] text-cream">{t.messages[step]}</p>
      </div>
      <button type="button" onClick={onReset} className="h-11 rounded-full border border-white/15 text-sm font-semibold text-cream">
        {t.again}
      </button>
    </div>
  );
}
