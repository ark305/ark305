"use client";

import Link from "next/link";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { useProposals } from "@/lib/resale-store";
import { monthly, positions } from "@/lib/talent";
import { useTeam } from "@/lib/team-store";
import { IconArrow, IconBag, IconPeople, IconSparkle } from "./icons";

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2.5 text-[14px] text-cream/90">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[12px] font-extrabold text-gold">{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

// Inicio de Business: las dos cosas principales, primero y con pasos claros.
export function BusinessStart({ locale }: { locale: Locale }) {
  const t = dict(locale).start;
  const hires = useTeam();
  const sent = useProposals();
  const teamTotal = hires.reduce((sum, h) => {
    const p = positions.find((x) => x.id === h.id);
    return sum + (!p ? 0 : p.unit === "h" ? monthly(p.rate * h.mult, h.hours) : Math.round(p.rate * h.mult));
  }, 0);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold text-white">{t.title}</h2>

      {/* 1 · Contratar talento */}
      <div className="flex flex-col gap-3 rounded-[24px] border border-gold/35 bg-gradient-to-br from-gold/[0.12] to-transparent p-4">
        <div className="flex items-center gap-3">
          <span className="gold-grad flex size-11 shrink-0 items-center justify-center rounded-[14px]">
            <IconPeople size={22} stroke="#08090B" weight={2} />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-white">{t.hire.title}</h3>
            <p className="text-[13px] leading-snug text-mute">{t.hire.sub}</p>
          </div>
        </div>
        <Steps steps={t.hire.steps} />
        <div className="grid grid-cols-2 gap-2">
          <Link href="/talento" className="gold-grad flex min-h-12 items-center justify-center rounded-full px-3 text-center text-[14px] font-bold text-ink">
            {t.hire.explore}
          </Link>
          <Link href="/equipo" className="flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-gold/40 px-3 text-center text-[13px] font-bold text-gold">
            <IconSparkle size={15} weight={2} /> {t.hire.ai}
          </Link>
        </div>
        {hires.length > 0 && (
          <Link href="/documentos" className="flex items-center justify-between rounded-[14px] bg-white/[0.05] px-3 py-2.5 text-[13px] font-semibold text-cream">
            {t.hire.yours(hires.length, formatPrice(teamTotal, locale))}
            <IconArrow size={15} className="text-gold" />
          </Link>
        )}
      </div>

      {/* 2 · Armar paquetes */}
      <div className="flex flex-col gap-3 rounded-[24px] border border-white/12 bg-white/[0.035] p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-cream">
            <IconBag size={22} stroke="#08090B" weight={2} />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-white">{t.bundle.title}</h3>
            <p className="text-[13px] leading-snug text-mute">{t.bundle.sub}</p>
          </div>
        </div>
        <Steps steps={t.bundle.steps} />
        <div className="grid grid-cols-2 gap-2">
          <Link href="/revender" className="flex min-h-12 items-center justify-center rounded-full bg-cream px-3 text-[14px] font-bold text-ink">
            {t.bundle.create}
          </Link>
          <Link href="/documentos" className="flex min-h-12 items-center justify-center rounded-full border border-white/15 px-3 text-[14px] font-bold text-cream">
            {t.bundle.docs}
          </Link>
        </div>
        {sent.length > 0 && <p className="text-[13px] text-mute">{t.bundle.yours(sent.length)}</p>}
      </div>
    </section>
  );
}
