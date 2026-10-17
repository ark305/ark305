"use client";

import { useState } from "react";
import { IconCheck } from "@/components/icons";
import { ToastButton } from "@/components/toast";
import { clubEconomics, clubs, getClub, type AllyCategory, type BenefitKind } from "@/lib/clubs";
import type { Locale } from "@/lib/locale";

export type ClubLabels = {
  poweredBy: string;
  selectClub: string;
  viewResident: string;
  viewDeveloper: string;
  welcome: string;
  unit: string;
  yourTier: string;
  benefits: string;
  allies: string;
  locked: string;
  use: string;
  used: string;
  tiersTitle: string;
  included: string;
  perMonth: string;
  memberPays: string;
  calcTitle: string;
  units: string;
  devCost: string;
  ofSales: string;
  members: string;
  arkYear: string;
  calcNote: string;
  demo: string;
  categories: Record<AllyCategory, string>;
  kinds: Record<BenefitKind, string>;
};

const usd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M` : n >= 1000 ? `$${Math.round(n / 1000).toLocaleString("en-US")}K` : `$${n}`;

const price = (n: number) => `$${n.toLocaleString("en-US")}`;

const CAT_ICON: Record<AllyCategory, string> = { restaurant: "R", beach: "B", marina: "M", spa: "S", gym: "G", art: "A" };

export function ClubApp({ initial, labels: l, locale }: { initial: string; labels: ClubLabels; locale: Locale }) {
  const [slug, setSlug] = useState(getClub(initial).slug);
  const [view, setView] = useState<"resident" | "developer">("resident");
  const club = getClub(slug);
  const [units, setUnits] = useState(club.units);
  const [c1, c2] = club.colors;
  const eco = clubEconomics(club, units);
  const myTier = club.tiers[club.resident.tier];

  const pick = (s: string) => {
    setSlug(s);
    setUnits(getClub(s).units);
    window.history.replaceState(null, "", `/club?c=${s}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold tracking-[0.12em] text-mute uppercase">{l.selectClub}</p>
        <div className="flex flex-wrap gap-1.5">
          {clubs.map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={c.slug === slug}
              onClick={() => pick(c.slug)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-bold ${c.slug === slug ? "border-white/25 bg-white/[0.1] text-white" : "border-white/10 text-mute"}`}
            >
              {c.short} · {c.developer}
            </button>
          ))}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[28px] p-5" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <span className="absolute top-4 right-4 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-white uppercase">{l.demo}</span>
        <p className="text-[11px] font-bold tracking-[0.14em] text-white/80 uppercase">{club.developer} · {club.hood}</p>
        <h2 className="mt-1 pr-14 font-display text-[30px] leading-[1.05] font-semibold text-white">{club.name}</h2>
        <p className="mt-2 text-[14px] leading-snug text-white/85">{club.tagline[locale]}</p>
        <p className="mt-4 text-[11px] font-bold tracking-[0.14em] text-white/70 uppercase">{l.poweredBy}</p>
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 p-1" role="tablist">
        {(["resident", "developer"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`h-10 rounded-full text-[13px] font-bold ${view === v ? "bg-cream text-ink" : "text-mute"}`}
          >
            {v === "resident" ? l.viewResident : l.viewDeveloper}
          </button>
        ))}
      </div>

      {view === "resident" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-[22px] border border-white/[0.08] bg-card p-4">
            <p className="text-[15px] font-bold text-white">{l.welcome.replace("{name}", club.resident.name)}</p>
            <p className="text-[12px] text-mute">{l.unit.replace("{unit}", club.resident.unit)}</p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl p-3" style={{ background: `${c1}33`, border: `1px solid ${c2}66` }}>
              <span>
                <span className="block text-[10px] font-bold tracking-[0.12em] text-cream/70 uppercase">{l.yourTier}</span>
                <span className="block text-xl font-bold text-white">{myTier.name}</span>
              </span>
              <span className="text-right text-[12px] text-cream/80">{myTier.paidBy === "developer" ? l.included : `${price(myTier.price)} ${l.perMonth}`}</span>
            </div>
            <p className="mt-4 text-[10px] font-bold tracking-[0.12em] text-mute uppercase">{l.benefits}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {club.tiers.slice(0, club.resident.tier + 1).flatMap((t) => t.perks).map((k) => (
                <li key={k.es} className="flex items-start gap-2.5 text-[14px] leading-snug text-cream/90">
                  <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-gold/15">
                    <IconCheck size={12} stroke="#D8B170" weight={2.6} />
                  </span>
                  {k[locale]}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-bold text-white">{l.allies} · {club.allies.length}</h3>
            {club.allies.map((a) => {
              const open = club.resident.tier >= a.minTier;
              return (
                <div key={a.id} className={`flex items-center gap-3 rounded-[20px] border border-white/[0.08] bg-card p-3 ${open ? "" : "opacity-60"}`}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} aria-hidden>
                    {CAT_ICON[a.category]}
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block truncate text-[14px] font-bold text-white">{a.name}</span>
                    <span className="block text-[11px] text-mute">{l.categories[a.category]} · {a.hood}</span>
                    <span className="mt-0.5 block text-[12px] text-cream/85">
                      <span className="font-bold text-gold-soft">{l.kinds[a.kind]}:</span> {a.benefit[locale]}
                    </span>
                  </span>
                  {open ? (
                    <ToastButton message={l.used} className="h-9 shrink-0 rounded-full border border-gold/40 px-3 text-[12px] font-bold text-gold-soft">
                      {l.use}
                    </ToastButton>
                  ) : (
                    <span className="shrink-0 text-right text-[10px] leading-tight text-mute">{l.locked.replace("{tier}", club.tiers[a.minTier].name)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h3 className="text-[15px] font-bold text-white">{l.tiersTitle}</h3>
          {club.tiers.map((t, i) => (
            <div key={t.id} className="rounded-[22px] border p-4" style={{ borderColor: i === club.tiers.length - 1 ? `${c2}99` : "rgba(255,255,255,.1)", background: "rgba(255,255,255,.035)" }}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-[22px] font-semibold text-white">{t.name}</p>
                <p className="text-[15px] font-extrabold text-gold-soft">{price(t.price)} {l.perMonth}</p>
              </div>
              <p className="text-[12px] text-mute">{t.paidBy === "developer" ? l.included : l.memberPays} · {Math.round(t.uptake * 100)}%</p>
              <ul className="mt-2 flex flex-col gap-1">
                {t.perks.map((k) => (
                  <li key={k.es} className="text-[13px] text-cream/85">· {k[locale]}</li>
                ))}
              </ul>
            </div>
          ))}

          <h3 className="mt-2 text-[15px] font-bold text-white">{l.calcTitle.replace("{club}", club.short)}</h3>
          <div className="flex flex-col gap-4 rounded-[22px] border border-gold/25 bg-card p-4">
            <label className="flex flex-col gap-1.5">
              <span className="flex items-baseline justify-between text-[13px] text-cream/80">
                {l.units} <span className="text-[15px] font-bold text-white">{units}</span>
              </span>
              <input type="range" min={50} max={1000} step={10} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="accent-[#D8B170]" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Out label={l.devCost} value={usd(eco.devCost24)} sub={l.ofSales.replace("{pct}", eco.pctOfSales.toLocaleString(locale === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 2 }))} />
              <Out label={l.arkYear} value={usd(eco.yearly)} gold />
            </div>
            <div className="flex flex-col gap-1.5">
              {eco.perTier.map((p) => (
                <div key={p.tier.id} className="flex items-baseline justify-between text-[13px]">
                  <span className="text-cream/85">{p.tier.name} · {p.members} {l.members}</span>
                  <span className="font-bold text-white">{usd(p.yearly)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-snug text-mute">{l.calcNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Out({ label, value, sub, gold }: { label: string; value: string; sub?: string; gold?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${gold ? "border-gold/25 bg-gold/[0.06]" : "border-white/[0.08] bg-raised"}`}>
      <p className={`text-[10px] font-bold tracking-[0.12em] uppercase ${gold ? "text-gold-soft" : "text-mute"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-mute">{sub}</p>}
    </div>
  );
}
