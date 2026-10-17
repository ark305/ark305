import type { Locale } from "@/lib/locale";
import type { MlsSnapshot, OffMarketCompare } from "@/lib/mls";

type Labels = {
  compareTitle: string;
  compareSub: string;
  exclusive: string;
  arkPpsf: string;
  mlsMedian: string;
  mlsDays: (n: number) => string;
  mlsActive: (n: number) => string;
  competing: (n: number, hood: string) => string;
  pulseTitle: string;
  pulseSub: string;
  median: string;
  ppsf: string;
  dom: string;
  active: string;
  live: string;
  demo: string;
  visionTitle: string;
  visionSub: string;
  phases: { tag: string; title: string; body: string; status: "now" | "next" | "later" }[];
  statusLabel: Record<"now" | "next" | "later", string>;
  sourceNote: string;
};

const money = (n: number, locale: Locale) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`
    : `$${n.toLocaleString("en-US")}`;

const STATUS_STYLE = {
  now: "border-gold bg-gold text-ink",
  next: "border-gold/60 text-gold-soft",
  later: "border-white/15 text-mute",
};

export function PrivateMls({ locale, snapshot, compare, l }: { locale: Locale; snapshot: MlsSnapshot; compare: OffMarketCompare[]; l: Labels }) {
  const sqft = locale === "es" ? "pie²" : "ft²";
  const sourceBadge = (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${
        snapshot.source === "live" ? "border-teal/50 bg-teal/10 text-teal" : "border-gold/40 bg-gold/[0.08] text-gold-soft"
      }`}
    >
      {snapshot.source === "live" ? l.live : l.demo}
    </span>
  );

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 px-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{l.compareTitle}</h2>
            <p className="text-sm text-mute">{l.compareSub}</p>
          </div>
          {sourceBadge}
        </div>
        <div className="flex flex-col gap-2.5 px-5">
          {compare.map((c) => (
            <div key={c.id} className="rounded-[22px] border border-gold/20 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-white">{c.name}</p>
                  <p className="text-[12px] text-mute">{c.hood}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gold/[0.12] px-2.5 py-1 text-[11px] font-bold text-gold-soft">{l.exclusive}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] p-3">
                  <p className="text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">{l.arkPpsf}</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    ${c.pricePerSqft.toLocaleString("en-US")}
                    <span className="text-[12px] font-semibold text-mute">/{sqft}</span>
                  </p>
                  <p className="text-[11px] text-cream/70">{money(c.fromUsd, locale)}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-raised p-3">
                  <p className="text-[10px] font-bold tracking-[0.12em] text-mute uppercase">{l.mlsMedian}</p>
                  {c.mls ? (
                    <>
                      <p className="mt-1 text-lg font-bold text-cream">
                        ${c.mls.pricePerSqft.toLocaleString("en-US")}
                        <span className="text-[12px] font-semibold text-mute">/{sqft}</span>
                      </p>
                      <p className="text-[11px] text-mute">
                        {l.mlsDays(c.mls.daysOnMarket)} · {l.mlsActive(c.mls.activeListings)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-lg font-bold text-mute">—</p>
                  )}
                </div>
              </div>
              {c.mls && <p className="mt-2.5 text-[12px] leading-snug text-cream/75">{l.competing(c.mls.activeListings, c.hood)}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{l.pulseTitle}</h2>
            <p className="text-sm text-mute">{l.pulseSub}</p>
          </div>
          {sourceBadge}
        </div>
        <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-card">
          <div className="grid grid-cols-[1.3fr_1fr_0.9fr_0.7fr] gap-2 border-b border-white/[0.07] px-4 py-2.5 text-[10px] font-bold tracking-[0.1em] text-mute uppercase">
            <span>{locale === "es" ? "Barrio" : "Area"}</span>
            <span className="text-right">{l.median}</span>
            <span className="text-right">{l.ppsf}</span>
            <span className="text-right">{l.dom}</span>
          </div>
          {snapshot.market.map((m) => (
            <div key={m.hood} className="grid grid-cols-[1.3fr_1fr_0.9fr_0.7fr] items-center gap-2 border-b border-white/[0.05] px-4 py-3 last:border-0">
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-white">{m.hood}</span>
                <span className="block text-[11px] text-mute">
                  {m.activeListings} {l.active}
                </span>
              </span>
              <span className="text-right text-[14px] font-semibold text-cream">{money(m.medianPrice, locale)}</span>
              <span className="text-right text-[14px] font-semibold text-gold-soft">${m.pricePerSqft.toLocaleString("en-US")}</span>
              <span className="text-right text-[14px] font-semibold text-cream">{m.daysOnMarket}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-snug text-mute">{l.sourceNote}</p>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{l.visionTitle}</h2>
          <p className="text-sm text-mute">{l.visionSub}</p>
        </div>
        <ol className="relative flex flex-col gap-3 border-l border-gold/25 pl-5">
          {l.phases.map((ph) => (
            <li key={ph.tag} className="relative">
              <span
                className={`absolute top-1.5 -left-[27px] size-3 rounded-full ring-4 ring-ink ${
                  ph.status === "now" ? "bg-gold" : ph.status === "next" ? "border-2 border-gold bg-ink" : "border-2 border-white/25 bg-ink"
                }`}
                aria-hidden
              />
              <div className="rounded-[20px] border border-white/[0.08] bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold tracking-[0.14em] text-gold-soft uppercase">{ph.tag}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[ph.status]}`}>{l.statusLabel[ph.status]}</span>
                </div>
                <p className="mt-1.5 text-[16px] font-bold text-white">{ph.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-cream/75">{ph.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
