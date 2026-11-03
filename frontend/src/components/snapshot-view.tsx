"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { courses } from "@/lib/community";
import { sanitize, type Answers, type Snapshot } from "@/lib/diagnosis";
import { useLocalDiagnosis } from "@/lib/diagnosis-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { requestSnapshot } from "@/lib/snapshot";
import { positions } from "@/lib/talent";
import { IconArrow, IconCap, IconCheck, IconSparkle } from "./icons";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{title}</p>
      {children}
    </section>
  );
}

function Items({ xs, locale }: { xs: { es: string; en: string }[]; locale: Locale }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {xs.map((x) => (
        <li key={x.es} className="flex gap-2 text-[15px] leading-snug text-cream">
          <IconCheck size={15} weight={2.4} className="mt-1 shrink-0 text-gold" /> {x[locale]}
        </li>
      ))}
    </ul>
  );
}

// El resultado del Diagnóstico. Si la cuenta tiene uno guardado, manda ese; si no, el del teléfono.
export function SnapshotView({ locale, fromAccount }: { locale: Locale; fromAccount: Answers | null }) {
  const t = dict(locale);
  const s = t.snap;
  const local = useLocalDiagnosis();
  const rawAnswers = fromAccount ?? local;
  const answers = rawAnswers ? sanitize(rawAnswers) : null;
  const answersKey = answers?.who ? JSON.stringify(answers) : null;
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; snapshot: Snapshot | null; error: boolean } | null>(null);
  const requestKey = answersKey ? `${answersKey}:${retry}` : null;

  useEffect(() => {
    if (!answersKey || !requestKey) return;
    let active = true;
    const controller = new AbortController();
    void requestSnapshot(JSON.parse(answersKey) as Answers, controller.signal)
      .then((snapshot) => { if (active) setResult({ key: requestKey, snapshot, error: false }); })
      .catch(() => { if (active) setResult({ key: requestKey, snapshot: null, error: true }); });
    return () => { active = false; controller.abort(); };
  }, [answersKey, requestKey]);

  const current = requestKey && result?.key === requestKey ? result : null;
  const snap = current?.snapshot ?? null;

  if (requestKey && !current)
    return <p role="status" className="px-4 pt-10 text-sm text-mute">{s.loading}</p>;

  if (current?.error)
    return (
      <div className="flex flex-col gap-4 px-4 pt-10">
        <h1 className="font-display text-[36px] leading-[1.05] font-semibold text-white">{s.title}</h1>
        <p role="alert" className="text-sm text-mute">{s.unavailable}</p>
        <button type="button" onClick={() => setRetry((value) => value + 1)} className="gold-grad flex h-[52px] items-center justify-center rounded-full text-base font-bold text-ink">
          {s.retry}
        </button>
      </div>
    );

  if (!snap)
    return (
      <div className="flex flex-col gap-4 px-4 pt-10">
        <h1 className="font-display text-[36px] leading-[1.05] font-semibold text-white">{s.title}</h1>
        <p className="text-[15px] text-mute">{t.diag.cardEmpty}</p>
        <Link href="/diagnostico" className="gold-grad flex h-[52px] items-center justify-center rounded-full text-base font-bold text-ink">
          {t.diag.start}
        </Link>
      </div>
    );

  const course = courses.find((c) => c.id === snap.course.id) ?? courses[0];
  return (
    <div className="flex flex-col gap-4 px-4 pt-8">
      <header className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-teal">
          <IconSparkle size={16} stroke="#7FC2B7" weight={1.9} /> {s.title}
        </span>
        <h1 className="font-display text-[30px] leading-[1.1] font-semibold text-white">{snap.summary[locale]}</h1>
      </header>

      <Section title={s.placement}>
        <p className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[13px] font-bold text-ink ${snap.side === "business" ? "bg-[#D8B170]" : "bg-[#7FC2B7]"}`}>{t.side[snap.side]}</span>
          {snap.ladder && <span className="rounded-full border border-white/15 px-3 py-1 text-[13px] font-bold text-cream">{`${s.ladderLabel}: ${s.ladder[snap.ladder]}`}</span>}
          {snap.size && <span className="rounded-full border border-white/15 px-3 py-1 text-[13px] font-bold text-cream">{snap.size[locale]}</span>}
          {snap.enterprise && <span className="rounded-full border border-white/15 px-3 py-1 text-[13px] font-bold text-cream">{t.side.enterprise}</span>}
        </p>
        <p className="text-[14px] leading-snug text-cream/85">{snap.reason[locale]}</p>
        {snap.ladder && <p className="text-[12px] text-mute">{s.ladderNote}</p>}
      </Section>

      <Section title={s.actions}>
        <ol className="flex flex-col gap-2">
          {snap.actions.map((a, i) => (
            <li key={a.href + i}>
              <Link href={a.href} className="flex min-h-12 items-center gap-3 rounded-[16px] bg-white/[0.05] px-3 py-2">
                <span className="gold-grad flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-ink">{i + 1}</span>
                <span className="grow text-[15px] font-semibold text-white">{a.label[locale]}</span>
                <IconArrow size={16} className="text-gold" />
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* Todos son cliente y proveedor a la vez */}
      <div className="grid grid-cols-1 gap-2">
        <Section title={s.demand}>
          <Items xs={snap.demand} locale={locale} />
        </Section>
        <Section title={s.supply}>
          {snap.supply.length ? <Items xs={snap.supply} locale={locale} /> : <p className="text-[14px] text-mute">{s.supplyNone}</p>}
        </Section>
        <p className="px-1 text-[12px] text-mute">{s.both}</p>
      </div>

      {snap.experiences && (
        <Section title={s.experiences}>
          <p className="text-[15px] leading-snug text-cream">
            {s.expLine(snap.experiences.kinds[locale].replace(/^./, (c) => c.toUpperCase()), snap.experiences.recipients[locale], snap.experiences.freq?.[locale])}
          </p>
          <Link href={`/mi-dia?q=${encodeURIComponent(snap.experiences.prompt[locale])}`} className="mt-1 text-sm font-bold text-gold">
            {s.planExp}: “{snap.experiences.prompt[locale]}” →
          </Link>
        </Section>
      )}

      <Section title={s.strengths}>
        <Items xs={snap.strengths} locale={locale} />
      </Section>
      <Section title={s.gaps}>
        <Items xs={snap.gaps} locale={locale} />
      </Section>
      <Section title={s.opportunities}>
        <Items xs={snap.opportunities} locale={locale} />
      </Section>

      <Section title={s.course}>
        <Link href="/academia" className="flex items-center gap-3">
          <span className="gloss flex size-12 shrink-0 items-center justify-center rounded-[15px]" style={{ "--c": course.color } as React.CSSProperties}>
            <IconCap size={24} stroke="#FFFFFF" weight={1.9} />
          </span>
          <span className="flex grow flex-col">
            <span className="text-[16px] font-bold text-white">{course.name[locale]}</span>
            <span className="text-[13px] text-mute">{snap.course.reason[locale]}</span>
          </span>
          <IconArrow size={16} className="text-gold" />
        </Link>
      </Section>

      {snap.dayPrompt && (
        <Section title={s.day}>
          <Link href={`/mi-dia?q=${encodeURIComponent(snap.dayPrompt[locale])}`} className="flex items-center justify-between gap-3 text-[15px] text-cream">
            “{snap.dayPrompt[locale]}”
            <IconArrow size={16} className="shrink-0 text-gold" />
          </Link>
        </Section>
      )}

      {snap.health && (
        <Section title={s.health}>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-white tabular-nums">{snap.health.score}</span>
            <span className="pb-1 text-sm text-mute">/ 100</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div className="gold-grad h-2 rounded-full" style={{ width: `${snap.health.score}%` }} />
          </div>
          <p className="text-[14px] text-cream">
            {s.metric}: <strong>{snap.health.metric[locale]}</strong>
          </p>
          <p className="text-[11px] text-mute">{s.healthNote}</p>
        </Section>
      )}

      {snap.blueprint && (
        <Section title={s.blueprint}>
          <ul className="flex flex-col gap-1 text-[14px] text-cream">
            {snap.blueprint.map((id) => {
              const p = positions.find((x) => x.id === id);
              return p ? <li key={id}>• {p.name[locale]}</li> : null;
            })}
          </ul>
          <Link href="/equipo" className="mt-1 text-sm font-bold text-gold">
            {t.biz.team.build} →
          </Link>
        </Section>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Link href={snap.side === "business" ? "/panel" : "/"} className="gold-grad flex h-[52px] items-center justify-center rounded-full text-base font-bold text-ink">
          {s.goHome}
        </Link>
        <Link href="/perfil/datos" className="flex h-11 items-center justify-center text-sm font-semibold text-mute">
          {s.knows}
        </Link>
      </div>
    </div>
  );
}
