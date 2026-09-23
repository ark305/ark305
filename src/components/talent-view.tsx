"use client";

import Link from "next/link";
import { useState } from "react";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { candidates, groups, HOURS, monthly, positions, type Position } from "@/lib/talent";
import { team, useTeam } from "@/lib/team-store";
import {
  IconBoat,
  IconBriefcase,
  IconCamera,
  IconCap,
  IconCar,
  IconChart,
  IconChef,
  IconChevron,
  IconClose,
  IconCode,
  IconHeadset,
  IconHome,
  IconImage,
  IconLock,
  IconMegaphone,
  IconMonitor,
  IconSearch,
  IconSparkle,
  IconWallet,
  IconWrench,
} from "./icons";

// Un ícono por categoría para distinguir los grupos de un vistazo.
const GROUP_ICON: Record<string, typeof IconCar> = {
  move: IconCar,
  marine: IconBoat,
  food: IconChef,
  home: IconHome,
  media: IconCamera,
  reno: IconWrench,
  tech: IconMonitor,
  cont: IconImage,
  mkt: IconMegaphone,
  sales: IconHeadset,
  ops: IconBriefcase,
  "tech-r": IconCode,
  fin: IconWallet,
  lead: IconChart,
  edu: IconCap,
  life: IconSparkle,
};
import { useToast } from "./toast";

type Filter = "all" | "inperson" | "remote";
type Term = "m" | "6" | "12";
const TERM_OFF: Record<Term, number> = { m: 0, "6": 0.1, "12": 0.15 };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const groupOf = (id: string) => groups.find((g) => g.id === id)!;

// Talento (sección de Business): posiciones presenciales y remotas del prototipo.
export function TalentView({ locale, canHire }: { locale: Locale; canHire: boolean }) {
  const t = dict(locale).talent;
  const [filter, setFilter] = useState<Filter>("all");
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Position | null>(null);

  const q = norm(query.trim());
  const byMode = positions.filter((p) => filter === "all" || p.mode === filter);
  const shown = byMode.filter((p) => (group === "all" || p.group === group) && (!q || norm(`${p.name[locale]} ${p.desc[locale]}`).includes(q)));
  const visibleGroups = groups.filter((g) => filter === "all" || g.mode === filter);
  const count = (f: Filter) => positions.filter((p) => f === "all" || p.mode === f).length;

  return (
    <div className="flex flex-col gap-4 px-4 pt-8">
      <header>
        <span className="mb-2 inline-flex rounded-full bg-[#8FB0D0]/15 px-3 py-1 text-[12px] font-bold text-[#8FB0D0]">{t.badge}</span>
        <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-white">{t.title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-mute">{t.intro}</p>
      </header>

      {!canHire && (
        <Link href="/niveles" className="flex items-center gap-3 rounded-[20px] border border-[#8FB0D0]/35 bg-[#8FB0D0]/[0.08] p-3.5">
          <IconLock size={18} stroke="#8FB0D0" weight={2} />
          <span className="grow text-sm font-semibold text-cream">{t.locked}</span>
          <span className="text-[13px] font-bold text-[#8FB0D0]">{t.lockedCta}</span>
          <IconChevron size={16} stroke="#8FB0D0" />
        </Link>
      )}

      <TeamSummary locale={locale} />

      {/* Presencial / Remoto */}
      <div role="radiogroup" className="glass grid h-12 grid-cols-3 rounded-full p-1">
        {(["all", "inperson", "remote"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={filter === f}
            onClick={() => {
              setFilter(f);
              setGroup("all");
            }}
            className={`rounded-full text-[14px] font-bold transition-colors ${filter === f ? "bg-cream text-ink" : "text-cream/80"}`}
          >
            {t.filters[f]} <span className="font-normal opacity-60">{count(f)}</span>
          </button>
        ))}
      </div>

      <label className="glass flex h-12 items-center gap-3 rounded-full px-4">
        <IconSearch size={20} stroke="#EFE6D8" weight={2} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="min-w-0 grow bg-transparent text-[15px] text-cream outline-none placeholder:text-mute"
        />
      </label>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {[{ id: "all", name: { es: t.allGroups, en: t.allGroups }, color: "#EFE6D8" }, ...visibleGroups].map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={group === g.id}
            onClick={() => setGroup(g.id)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold ${group === g.id ? "bg-cream text-ink" : "border border-white/10 bg-white/[0.04] text-cream"}`}
          >
            {g.id !== "all" && <span className="size-2 rounded-full" style={{ background: g.color }} />}
            {g.name[locale]}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-mute">{t.count(shown.length)}</p>

      <ul className="flex flex-col">
        {shown.map((p) => {
          const g = groupOf(p.group);
          const GroupIcon = GROUP_ICON[p.group] ?? IconBriefcase;
          return (
            <li key={p.id}>
              <button type="button" onClick={() => setOpen(p)} className="flex w-full items-center gap-3.5 border-b border-white/[0.07] py-3 text-left">
                <span className="gloss flex size-12 shrink-0 items-center justify-center rounded-[15px]" style={{ "--c": g.color } as React.CSSProperties}>
                  <GroupIcon size={22} stroke="#FFFFFF" weight={2} />
                </span>
                <span className="flex min-w-0 grow flex-col">
                  <span className="truncate text-[15px] font-bold text-white">{p.name[locale]}</span>
                  <span className="truncate text-[12px] text-mute">{p.desc[locale]}</span>
                  <span className="mt-0.5 text-[11px] font-semibold" style={{ color: g.color }}>
                    {p.mode === "remote" ? t.remote : t.inperson}
                  </span>
                </span>
                <Rate p={p} locale={locale} />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-center text-[11px] text-mute">{t.note}</p>

      {open && <HireSheet p={open} locale={locale} canHire={canHire} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Rate({ p, locale }: { p: Position; locale: Locale }) {
  const t = dict(locale).talent;
  if (p.unit === "q") return <span className="shrink-0 text-[13px] font-semibold text-gold-soft">{t.units.q}</span>;
  return (
    <span className="flex shrink-0 flex-col items-end">
      <span className="text-[11px] text-mute">{t.from}</span>
      <span className="text-[15px] font-bold text-white tabular-nums">
        {formatPrice(p.rate, locale)}
        <span className="text-[11px] font-normal text-mute"> {t.units[p.unit]}</span>
      </span>
    </span>
  );
}

function HireSheet({ p, locale, canHire, onClose }: { p: Position; locale: Locale; canHire: boolean; onClose: () => void }) {
  const t = dict(locale).talent;
  const { show } = useToast();
  const cands = candidates(p);
  const [pick, setPick] = useState(0);
  const [hours, setHours] = useState(p.mode === "remote" ? 20 : 5);
  const hourly = p.unit === "h";
  const rate = p.rate * cands[pick].mult;
  const g = groupOf(p.group);

  function hire() {
    if (p.unit === "q") {
      show(t.quoted);
    } else {
      team.add({ id: p.id, candidate: cands[pick].name, mult: cands[pick].mult, hours: hourly ? hours : 0 });
      show(t.added(cands[pick].name));
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-label={p.name[locale]}
        className="max-h-[88dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] border-t border-line bg-card px-5 pt-5"
        style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold" style={{ color: g.color }}>
              {g.name[locale]} · {p.mode === "remote" ? t.remote : t.inperson}
            </p>
            <h2 className="mt-0.5 text-2xl font-extrabold text-white">{p.name[locale]}</h2>
            <p className="mt-1 text-[15px] leading-snug text-mute">{p.desc[locale]}</p>
          </div>
          <button type="button" aria-label={dict(locale).common.close} onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <IconClose size={16} stroke="#EFE6D8" />
          </button>
        </div>

        <p className="mt-5 mb-2 text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{t.candidates}</p>
        <div className="flex flex-col gap-2">
          {cands.map((c, i) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={pick === i}
              onClick={() => setPick(i)}
              className={`flex items-center gap-3 rounded-[18px] border p-3 text-left ${pick === i ? "border-cream/70 bg-white/[0.07]" : "border-white/10"}`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-ink" style={{ background: g.color }}>
                {c.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <span className="flex grow flex-col">
                <span className="text-[15px] font-bold text-white">{c.name}</span>
                <span className="text-[12px] text-mute">
                  {c.place} · ★ {c.rating} · {t.years(c.years)} · {c.langs}
                </span>
              </span>
              {p.unit !== "q" && (
                <span className="shrink-0 text-sm font-bold whitespace-nowrap text-cream tabular-nums">
                  {formatPrice(Math.round(p.rate * c.mult), locale)}
                  <span className="text-[11px] font-normal text-mute"> {t.units[p.unit]}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {p.unit === "h" && (
          <p className="mt-3 text-[12px] text-mute">
            {dict(locale).money.talentSplit(formatPrice(Math.round(rate / 1.2), locale), formatPrice(Math.round(rate - rate / 1.2), locale))}
          </p>
        )}
        {hourly && (
          <>
            <p className="mt-5 mb-2 text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{t.hours}</p>
            <div className="grid grid-cols-4 gap-2">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={hours === h}
                  onClick={() => setHours(h)}
                  className={`h-11 rounded-full text-[15px] font-bold ${hours === h ? "bg-cream text-ink" : "border border-white/10 text-cream"}`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[18px] bg-white/[0.05] px-4 py-3">
              <span className="text-sm text-mute">{t.monthly}</span>
              <span className="text-lg font-extrabold text-white tabular-nums">{formatPrice(monthly(rate, hours), locale)}</span>
            </div>
          </>
        )}

        {canHire ? (
          <button type="button" onClick={hire} className="gold-grad mt-5 h-[52px] w-full rounded-full text-base font-bold text-ink">
            {p.unit === "q" ? t.quote : t.add}
          </button>
        ) : (
          <Link href="/niveles" className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#8FB0D0] text-base font-bold text-ink">
            <IconLock size={18} stroke="#08090B" weight={2} /> {t.locked}
          </Link>
        )}
      </div>
    </div>
  );
}

function TeamSummary({ locale }: { locale: Locale }) {
  const t = dict(locale).talent;
  const hires = useTeam();
  const [term, setTerm] = useState<Term>("m");
  if (hires.length === 0) return null;

  const cost = (h: (typeof hires)[number]) => {
    const p = positions.find((x) => x.id === h.id);
    if (!p) return 0;
    return p.unit === "h" ? monthly(p.rate * h.mult, h.hours) : Math.round(p.rate * h.mult);
  };
  const subtotal = hires.reduce((s, h) => s + cost(h), 0);
  const off = Math.round(subtotal * TERM_OFF[term]);
  const fee = Math.round((subtotal - off) * 0.05);
  const money = (n: number) => formatPrice(n, locale);

  return (
    <section className="flex flex-col gap-3 rounded-[24px] border border-gold/30 bg-gradient-to-br from-[#241e15] to-ink p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold text-white">{t.yourTeam}</h2>
        <span className="text-sm text-mute">{t.people(hires.length)}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {hires.map((h) => {
          const p = positions.find((x) => x.id === h.id);
          if (!p) return null;
          return (
            <li key={h.uid} className="flex items-center gap-2 text-sm">
              <span className="flex min-w-0 grow flex-col">
                <span className="truncate font-semibold text-cream">{p.name[locale]}</span>
                <span className="text-[12px] text-mute">
                  {h.candidate}
                  {h.hours ? ` · ${dict(locale).community.perWeek(h.hours)}` : ""}
                </span>
              </span>
              <span className="text-cream tabular-nums">{money(cost(h))}</span>
              <button type="button" aria-label={t.remove} onClick={() => team.remove(h.uid)} className="flex size-7 items-center justify-center rounded-full bg-white/[0.07]">
                <IconClose size={12} stroke="#9A9EA6" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-3 gap-1.5">
        {(["m", "6", "12"] as Term[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={term === k}
            onClick={() => setTerm(k)}
            className={`h-9 rounded-full text-[12px] font-bold ${term === k ? "gold-grad text-ink" : "border border-white/10 text-cream"}`}
          >
            {t.terms[k]}
          </button>
        ))}
      </div>
      {term !== "m" && <p className="text-[12px] text-gold-soft">{t.termsNote}</p>}
      <div className="flex flex-col gap-1 border-t border-white/10 pt-2 text-sm text-mute">
        {off > 0 && (
          <div className="flex justify-between text-gold-soft">
            <span>{t.terms[term]}</span>
            <span className="tabular-nums">−{money(off)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t.fee}</span>
          <span className="tabular-nums">{money(fee)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-white">
          <span>{dict(locale).day.total}</span>
          <span className="tabular-nums">
            {money(subtotal - off + fee)} <span className="text-sm font-normal text-mute">{t.perMonth}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
