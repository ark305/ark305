import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IconCheck, IconCrown } from "@/components/icons";
import { NodeCalculator } from "@/components/node-calculator";
import { ToastButton } from "@/components/toast";
import { clubs } from "@/lib/clubs";
import { demoProject, devTiers, hoodDemand, matchedBuyers, nodeKinds, pitchDevelopments, residentPerks, revenueStreams } from "@/lib/developers";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.developers.title };
}

const HERO = "https://images.unsplash.com/photo-1589159812824-9d955325fe94";

// ARK Developer Access: los developers se suscriben para recibir los mejores compradores del ecosistema ARK.
export default async function DevelopersPage() {
  const { locale, t } = await getContext();
  const d = t.developers;
  const pipeline = matchedBuyers.reduce((s, b) => s + b.budgetMid, 0);
  const maxBuyers = Math.max(...hoodDemand.map((h) => h.buyers));
  const club = clubs[0];

  return (
    <div className="flex flex-col gap-8">
      <section className="relative flex h-[420px] flex-col justify-end gap-2 overflow-hidden px-5 pb-6">
        <Image src={HERO} alt="" fill priority sizes="430px" className="object-cover" />
        <div className="fade-bottom absolute inset-0" />
        <span className="relative flex w-fit items-center gap-1.5 rounded-full border border-gold/50 bg-black/40 px-3 py-1 text-[12px] font-bold text-gold-soft backdrop-blur">
          <IconCrown size={13} stroke="#EBD3A0" weight={2} /> {d.badge}
        </span>
        <h1 className="relative font-display text-[38px] leading-[1.05] font-semibold text-white">{d.title}</h1>
        <p className="relative text-[15px] leading-normal text-cream/80">{d.intro}</p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="px-5">
          <h2 className="font-display text-2xl font-semibold text-white">{d.landscapeTitle}</h2>
          <p className="text-sm text-mute">{d.landscapeSub(pitchDevelopments.length)}</p>
        </div>
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-1">
          {pitchDevelopments.map((p) => (
            <Link
              key={p.img}
              href={p.club ? `/club?c=${p.club}` : "#planes"}
              className={`relative flex h-[220px] w-[170px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[22px] border p-3 ${p.club ? "border-gold/60" : "border-white/[0.08]"}`}
            >
              <Image src={`/pitch/landscape/${p.img}`} alt="" fill sizes="170px" className="object-cover" />
              <div className="fade-bottom absolute inset-0" />
              <span className={`relative mb-auto w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${p.club ? "gold-grad text-ink" : "bg-black/50 text-cream backdrop-blur"}`}>
                {p.club ? d.clubLive : d.clubOpen}
              </span>
              <span className="relative text-[14px] leading-tight font-bold text-white">{p.name}</span>
              <span className="relative text-[11px] text-cream/75">{p.place}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{d.networkTitle}</h2>
            <p className="text-sm text-mute">{d.networkSub(club.name)}</p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/40 bg-gold/[0.08] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">{d.demo}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label={d.networkStat} value={String(club.allies.length)} gold />
          <Stat label={club.short} value={`${club.units} u.`} />
        </div>
        <ul className="flex flex-col divide-y divide-white/[0.06] rounded-[22px] border border-white/[0.08] bg-card px-4">
          {club.allies.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-white">{a.name}</span>
                <span className="block text-[12px] text-mute">{a.hood}</span>
              </span>
              <span className="max-w-[55%] text-right text-[12px] leading-snug font-semibold text-gold-soft">{a.benefit[locale]}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/mapa?capa=ally,residence&zona=${encodeURIComponent(club.hood)}`} className="flex h-11 items-center justify-center rounded-full border border-gold/40 px-2 text-center text-[12px] font-bold text-gold-soft">
            {d.networkMap}
          </Link>
          <Link href={`/club?c=${club.slug}`} className="flex h-11 items-center justify-center rounded-full border border-gold/40 px-2 text-center text-[12px] font-bold text-gold-soft">
            {d.networkClub}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{d.payTitle}</h2>
          <p className="text-sm text-mute">{d.paySub}</p>
        </div>
        {revenueStreams.map((r) => (
          <div key={r.id} className="rounded-[20px] border border-white/[0.08] bg-card p-4">
            <p className="text-[15px] font-bold text-white">{r.name[locale]}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-cream/75">{r.body[locale]}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div>
          <h2 className="font-display text-[28px] leading-tight font-semibold text-white">{d.title2}</h2>
          <p className="mt-1 text-sm leading-snug text-mute">{d.intro2}</p>
        </div>
        <h3 className="text-[15px] font-bold text-white">{d.howTitle}</h3>
        <ol className="flex flex-col gap-2.5">
          {d.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-[20px] border border-white/[0.08] bg-card p-4">
              <span className="gold-grad flex size-8 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold text-ink">{i + 1}</span>
              <span>
                <span className="block text-[15px] font-bold text-white">{s.title}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-cream/75">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{d.dealsTitle}</h2>
            <p className="text-sm text-mute">{d.dealsSub(demoProject.name, demoProject.hood)}</p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/40 bg-gold/[0.08] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">{d.demo}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label={d.matched} value={String(matchedBuyers.length)} />
          <Stat label={d.pipeline} value={`$${(pipeline / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`} gold />
        </div>

        {matchedBuyers.map((b) => (
          <div key={b.id} className="rounded-[22px] border border-gold/20 bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-white">{b.who[locale]}</p>
                <p className="text-[12px] text-mute">
                  {b.budget} · {b.wants[locale]}
                </p>
                <p className="text-[12px] text-cream/70">{b.timeline[locale]}</p>
              </div>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-xl font-extrabold text-gold-soft">{b.match}%</span>
                <span className="text-[10px] font-bold tracking-[0.1em] text-mute uppercase">{d.match}</span>
              </span>
            </div>
            <p className="mt-3 text-[10px] font-bold tracking-[0.12em] text-mute uppercase">{d.needs}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {b.services.map((s) => (
                <span key={s.es} className="rounded-full bg-gold/[0.1] px-2.5 py-1 text-[12px] font-semibold text-gold-soft">
                  {s[locale]}
                </span>
              ))}
            </div>
            <ToastButton message={d.introSent} className="mt-3 h-10 w-full rounded-full border border-gold/40 text-[13px] font-bold text-gold-soft">
              {d.requestIntro}
            </ToastButton>
          </div>
        ))}
        <p className="text-[11px] leading-snug text-mute">{d.privacy}</p>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{d.demandTitle}</h2>
          <p className="text-sm text-mute">{d.demandSub}</p>
        </div>
        <div className="flex flex-col gap-3 rounded-[22px] border border-white/[0.08] bg-card p-4">
          {hoodDemand.map((h) => (
            <div key={h.hood}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-bold text-white">{h.hood}</span>
                <span className="text-[12px] text-mute">
                  <span className="font-bold text-gold-soft">{h.buyers}</span> {d.buyers} · {h.budget}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="gold-grad h-full rounded-full" style={{ width: `${(h.buyers / maxBuyers) * 100}%` }} />
              </div>
              <p className="mt-1 text-[12px] text-cream/70">{h.need[locale]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{d.nodesTitle}</h2>
            <p className="text-sm text-mute">{d.nodesSub}</p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/40 bg-gold/[0.08] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">{d.demo}</span>
        </div>
        <Stat label={d.nodesTotal} value={nodeKinds.reduce((s, n) => s + n.count, 0).toLocaleString("en-US")} gold />
        <div className="grid grid-cols-2 gap-2">
          {nodeKinds.map((n) => (
            <div key={n.id} className="rounded-2xl border border-white/[0.08] bg-card p-3">
              <p className="text-2xl font-bold text-white">{n.count}</p>
              <p className="text-[13px] font-bold text-cream">{n.name[locale]}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-mute">{n.pays[locale]}</p>
            </div>
          ))}
        </div>
        <Link href="/mapa" className="flex h-11 items-center justify-center rounded-full border border-gold/40 text-[13px] font-bold text-gold-soft">
          {d.mapLink}
        </Link>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{d.residentTitle}</h2>
          <p className="text-sm text-mute">{d.residentSub}</p>
        </div>
        <div className="flex flex-col gap-3 rounded-[22px] border border-gold/30 bg-gradient-to-br from-[#2a2217] via-[#141210] to-ink p-4">
          <p className="text-[15px] font-extrabold text-gold-soft">{d.residentPrice}</p>
          <ul className="flex flex-col gap-1.5">
            {residentPerks.map((k) => (
              <li key={k.es} className="flex items-start gap-2.5 text-[14px] leading-snug text-cream/90">
                <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-gold/15">
                  <IconCheck size={12} stroke="#D8B170" weight={2.6} />
                </span>
                {k[locale]}
              </li>
            ))}
          </ul>
        </div>
        <h3 className="mt-2 text-[15px] font-bold text-white">{d.calcTitle}</h3>
        <NodeCalculator labels={d.calc} locale={locale} />
        <Link href="/club?c=frida" className="flex h-11 items-center justify-center rounded-full border border-gold/40 text-[13px] font-bold text-gold-soft">
          {d.clubLink}
        </Link>
      </section>

      <section id="planes" className="flex scroll-mt-6 flex-col gap-4 px-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{d.plansTitle}</h2>
          <p className="text-sm text-mute">{d.plansSub}</p>
        </div>
        {devTiers.map((tier) => {
          const top = tier.id === "founding";
          return (
            <div
              key={tier.id}
              className={`flex flex-col gap-4 rounded-[28px] border p-5 ${top ? "border-gold/45 bg-gradient-to-br from-[#2a2217] via-[#141210] to-ink" : "border-white/10 bg-white/[0.035]"}`}
              style={top ? { boxShadow: "0 30px 80px -40px #d8b17099" } : undefined}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`flex items-center gap-2 font-display text-[28px] leading-tight font-semibold ${top ? "text-gold-soft" : "text-white"}`}>
                    {top && <IconCrown size={22} stroke="#EBD3A0" weight={1.8} />}
                    {tier.name}
                  </h3>
                  <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-semibold text-cream">{tier.seats[locale]}</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-gold-soft">{tier.price[locale]}</p>
                <p className="mt-1 text-sm text-mute">{tier.tagline[locale]}</p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {tier.perks.map((k) => (
                  <li key={k.es} className="flex items-start gap-2.5 text-[15px] leading-snug text-cream/90">
                    <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-gold/15">
                      <IconCheck size={12} stroke="#D8B170" weight={2.6} />
                    </span>
                    {k[locale]}
                  </li>
                ))}
              </ul>
              <ToastButton message={d.applied} className={`h-12 rounded-full text-[15px] font-bold text-ink ${top ? "gold-grad" : "bg-cream"}`}>
                {d.apply(tier.name)}
              </ToastButton>
            </div>
          );
        })}
        <p className="text-center text-[11px] text-mute">{d.demoNote}</p>
      </section>
    </div>
  );
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${gold ? "border-gold/25 bg-gold/[0.06]" : "border-white/[0.08] bg-raised"}`}>
      <p className={`text-[10px] font-bold tracking-[0.12em] uppercase ${gold ? "text-gold-soft" : "text-mute"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
