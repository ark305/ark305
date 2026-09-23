"use client";

import Link from "next/link";
import { useTransition } from "react";
import { clearDiagnosis, saveDiagnosis } from "@/lib/actions";
import { allQuestions, answerLabel, sanitize, type Answers } from "@/lib/diagnosis";
import { useLocalDiagnosis, writeDiagnosis } from "@/lib/diagnosis-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import type { Side } from "@/lib/mode";
import { taste, useTaste } from "@/lib/taste";
import { IconClose } from "./icons";
import { useToast } from "./toast";

// "Lo que ARK sabe de mí": ver, borrar respuestas y lo que aprendió el feed.
export function KnowsView({ locale, fromAccount, side, signedIn }: { locale: Locale; fromAccount: Answers | null; side: Side | null; signedIn: boolean }) {
  const t = dict(locale);
  const k = t.knows;
  const { show } = useToast();
  const [pending, start] = useTransition();
  const local = useLocalDiagnosis();
  const answers = fromAccount ?? (local ? sanitize(local) : null);
  const learned = useTaste();
  const topics = Object.entries(learned.taste).filter(([, v]) => v !== 0) as [keyof typeof t.feed.topics, number][];

  function removeAnswer(id: string) {
    if (!answers) return;
    // Borrar "quién eres" borra todo el diagnóstico (las demás preguntas dependen de eso).
    const next: Answers = id === "who" ? {} : { ...answers, [id]: id === "interests" || id === "skills" || id === "assets" || id === "needs" ? [] : "" };
    writeDiagnosis(id === "who" ? null : next);
    start(async () => {
      if (id === "who") await clearDiagnosis();
      else if (signedIn) await saveDiagnosis(next, false);
    });
  }

  function deleteAll() {
    if (!confirm(k.confirmAll)) return;
    writeDiagnosis(null);
    taste.reset();
    start(async () => {
      await clearDiagnosis();
      show(k.deleted);
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-8">
      <header>
        <Link href="/perfil" className="text-sm font-semibold text-mute">
          ← {t.edit.back}
        </Link>
        <h1 className="mt-2 font-display text-[34px] leading-[1.05] font-semibold text-white">{k.title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-mute">{k.sub}</p>
      </header>

      <section className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
        <p className="text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{k.diagnosis}</p>
        {!answers?.who ? (
          <p className="text-[15px] text-cream/80">{k.none}</p>
        ) : (
          allQuestions(answers)
            .filter((q) => answers[q.id] !== undefined && answerLabel(q, answers[q.id], locale) !== "—")
            .map((q) => (
              <div key={q.id} className="flex items-start gap-3 border-b border-white/[0.06] py-2 last:border-0">
                <span className="flex grow flex-col">
                  <span className="text-[12px] text-mute">{q.ask[locale]}</span>
                  <span className="text-[15px] font-semibold text-white">{answerLabel(q, answers[q.id], locale)}</span>
                </span>
                <button type="button" disabled={pending} aria-label={k.remove} onClick={() => removeAnswer(q.id)} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">
                  <IconClose size={14} stroke="#9A9EA6" />
                </button>
              </div>
            ))
        )}
        <Link href="/diagnostico" className="mt-1 text-sm font-bold text-gold">
          {answers?.who ? t.diag.redo : t.diag.start} →
        </Link>
      </section>

      <section className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
        <p className="text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{k.feed}</p>
        {topics.length === 0 ? (
          <p className="text-[15px] text-cream/80">{k.feedNone}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map(([topic, pts]) => (
              <span key={topic} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-1 pl-3 text-[13px] text-cream">
                {t.feed.topics[topic]} · {k.points(pts)}
                <button type="button" aria-label={k.remove} onClick={() => taste.forget(topic)} className="flex size-6 items-center justify-center rounded-full bg-white/10">
                  <IconClose size={11} stroke="#EFE6D8" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-[13px] text-mute">
          {k.saved(learned.saved.length)} · {k.hidden(learned.hidden.length)}
        </p>
      </section>

      <section className="flex flex-col gap-1 rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
        <p className="text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{k.side}</p>
        <p className="text-[15px] font-semibold text-white">{side ? t.side[side] : "—"}</p>
      </section>

      <section className="flex flex-col gap-1 rounded-[22px] border border-teal/25 bg-teal/[0.05] p-4">
        <p className="text-[11px] font-bold tracking-[0.14em] text-teal uppercase">{k.never}</p>
        <p className="text-[14px] text-cream">{k.neverList}</p>
        <p className="mt-1 text-[13px] text-mute">{k.private}</p>
      </section>

      <button type="button" disabled={pending} onClick={deleteAll} className="h-12 rounded-full border border-[#E07A8F]/40 text-[15px] font-semibold text-[#E07A8F]">
        {k.deleteAll}
      </button>
    </div>
  );
}
