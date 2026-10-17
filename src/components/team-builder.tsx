"use client";

import Link from "next/link";
import { useState } from "react";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { candidates, positions } from "@/lib/talent";
import { askArk } from "@/lib/ai-client";
import { planFromRoles, planTeam, teamSummary, type TeamPlan } from "@/lib/team-planner";
import { team } from "@/lib/team-store";
import { IconLock, IconPeople } from "./icons";
import { useToast } from "./toast";

// ARK IA en Business: tono directo, con números.
export function TeamBuilder({ locale, canHire }: { locale: Locale; canHire: boolean }) {
  const t = dict(locale);
  const b = t.biz.team;
  const money = (n: number) => formatPrice(n, locale);
  const { show } = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<TeamPlan | null>(null);
  const [added, setAdded] = useState(false);
  const [live, setLive] = useState(false);

  function build(prompt = text) {
    if (!prompt.trim()) return;
    setText(prompt);
    setBusy(true);
    setPlan(null);
    setAdded(false);
    askArk<{ roles: { id: string; hours: number }[] }>({ kind: "team", prompt, locale }).then((r) => {
      setLive(!!r);
      setPlan(r ? planFromRoles(r.roles) : planTeam(prompt));
      setBusy(false);
    });
  }

  function addAll() {
    if (!plan) return;
    plan.lines.forEach((l) => {
      const p = positions.find((x) => x.id === l.id)!;
      if (p.unit === "q") return;
      const c = candidates(p)[0];
      team.add({ id: p.id, candidate: c.name, mult: c.mult, hours: l.hours });
    });
    setAdded(true);
    show(b.added);
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8">
      <header>
        <span className="mb-2 inline-flex rounded-full bg-gold/15 px-3 py-1 text-[12px] font-bold text-gold">Business</span>
        <h1 className="font-display text-[38px] leading-[1.05] font-semibold text-white">{b.title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-mute">{b.sub}</p>
      </header>

      <section className="flex flex-col gap-3 rounded-[24px] border border-gold/30 bg-gold/[0.05] p-4">
        <label htmlFor="brief" className="flex items-center gap-2 text-sm font-bold text-gold">
          <IconPeople size={18} weight={2} /> {b.label}
        </label>
        <textarea
          id="brief"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={b.placeholder}
          className="resize-none rounded-[16px] border border-white/10 bg-ink/60 px-4 py-3 text-base leading-snug text-cream outline-none placeholder:text-mute focus:border-gold/60"
        />
        <button type="button" onClick={() => build()} disabled={busy} className="gold-grad h-12 rounded-full text-[15px] font-bold text-ink disabled:opacity-60">
          {busy ? b.building : b.build}
        </button>
        <div className="flex flex-wrap gap-2">
          {b.suggestions.map((s) => (
            <button key={s} type="button" onClick={() => build(s)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-cream">
              {s}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-mute">{live ? t.common.aiLive : b.preview}</p>
      </section>

      <Link href="/talento" className="-mt-2 text-center text-sm font-semibold text-gold">
        {t.start.toTalent} →
      </Link>

      {plan && (
        <section className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
          <p className="text-[11px] font-bold tracking-[0.14em] text-gold uppercase">{b.proposal}</p>
          <p className="text-[15px] leading-normal text-cream">{teamSummary(plan, locale, money)}</p>
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] text-mute uppercase">
              <tr>
                <th className="py-1.5 font-semibold">{b.role}</th>
                <th className="py-1.5 text-right font-semibold">{b.hours}</th>
                <th className="py-1.5 text-right font-semibold">{b.monthly}</th>
              </tr>
            </thead>
            <tbody>
              {plan.lines.map((l) => {
                const p = positions.find((x) => x.id === l.id)!;
                return (
                  <tr key={l.id} className="border-t border-white/[0.07] text-cream">
                    <td className="py-2 pr-2">{p.name[locale]}</td>
                    <td className="py-2 text-right tabular-nums">{l.hours || "—"}</td>
                    <td className="py-2 text-right tabular-nums">{l.monthly ? money(l.monthly) : b.quote}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-white/20 font-bold text-white">
                <td className="py-2">{t.day.total}</td>
                <td className="py-2 text-right tabular-nums">{plan.hoursPerWeek}</td>
                <td className="py-2 text-right tabular-nums">{money(plan.total)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[11px] text-mute">{b.pricing}</p>
          {canHire ? (
            added ? (
              <Link href="/documentos" className="gold-grad flex h-12 items-center justify-center rounded-full text-[15px] font-bold text-ink">
                {b.contract}
              </Link>
            ) : (
              <button type="button" onClick={addAll} className="gold-grad h-12 rounded-full text-[15px] font-bold text-ink">
                {b.add}
              </button>
            )
          ) : (
            <Link href="/niveles" className="flex h-12 items-center justify-center gap-2 rounded-full bg-gold text-[15px] font-bold text-ink">
              <IconLock size={16} stroke="#08090B" weight={2} /> {t.talent.locked}
            </Link>
          )}
          <Link href="/revender" className="text-center text-[13px] font-semibold text-mute">
            {t.start.toResell} →
          </Link>
        </section>
      )}
    </div>
  );
}
