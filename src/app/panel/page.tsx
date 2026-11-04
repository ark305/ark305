import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FeaturesFeed, type FeatureGroup, type FeatureKey } from "@/components/features-feed";
import { IconChevron } from "@/components/icons";
import { Photo } from "@/components/photo";
import { BusinessPanel } from "@/components/business-panel";
import { BusinessStart } from "@/components/business-start";
import { SellerAi } from "@/components/seller-ai";
import { SidePill } from "@/components/side-switch";
import { getItem } from "@/lib/catalog";
import { formatTime } from "@/lib/dict";
import { getContext, getDictionary } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";
import { CURRENT_HANDLE, formatCount, formatPrice, getProfile } from "@/lib/mock-data";
import { getViewer } from "@/lib/profiles-db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.panel };
}

const COLORS: Record<FeatureKey, string> = {
  ai: "#7FC2B7",
  bookings: "#D8B170",
  teams: "#E07A8F",
  events: "#B7A58A",
  talent: "#C49BD0",
  analytics: "#6FA8C9",
};

const GROUPS: { title: "doIt" | "grow" | "measure"; keys: FeatureKey[] }[] = [
  { title: "doIt", keys: ["ai", "bookings"] },
  { title: "grow", keys: ["teams", "events", "talent"] },
  { title: "measure", keys: ["analytics"] },
];

// Reservas de ejemplo que le llegan a Lente 305.
const UPCOMING = [
  { client: "Sofía P.", service: "photographer", time: "15:00", confirmed: true },
  { client: "Andrés & Co.", service: "reel", time: "17:30", confirmed: true },
  { client: "Mia R.", service: "drone", time: "10:00", confirmed: false },
];

// Inicio del modo Ofrecer.
export default async function PanelPage() {
  const { locale, t, level, view } = await getContext();
  const business = view === "business";
  const p = t.panel;
  // Tu perfil real si entraste; si no, el de ejemplo para que el Panel se pueda recorrer.
  const me = (await getViewer()).profile ?? getProfile(CURRENT_HANDLE)!;
  const lvl = getLevel(level);

  const groups: FeatureGroup[] = GROUPS.map((g) => ({
    title: p.groups[g.title],
    count: p.count(g.keys.length),
    items: g.keys.map((key) => ({ key, color: COLORS[key], ...p.features[key], href: key === "talent" ? "/talento" : undefined })),
  }));

  const stats = [
    { label: p.stats.today, value: "3" },
    { label: p.stats.month, value: formatPrice(4850, locale) },
    { label: p.stats.views, value: formatCount(1240, locale) },
  ];

  return (
    <div>
      <div className="flex flex-col gap-5 px-4 pt-8 pb-10">
        <div className="-mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-mute">{business ? t.side.businessTag : t.side.personalTag}</span>
          <SidePill side={business ? "business" : "personal"} label={business ? t.side.personal : t.side.business} />
        </div>
        <header className="flex items-center gap-3.5">
          <span className="gold-grad relative size-14 shrink-0 rounded-full p-[2px]">
            <span className="relative block size-full overflow-hidden rounded-full">
              <Photo src={me.photo} name={me.name} sizes="56px" />
            </span>
          </span>
          <div>
            <h1 className="font-display text-[30px] leading-tight font-semibold text-white">{business ? t.biz.panel.hello(me.name) : p.hello(me.name)}</h1>
            <p className="text-sm text-mute">{business ? t.biz.panel.sub : p.sub}</p>
          </div>
        </header>

        {business ? (
          <>
            <BusinessStart locale={locale} />
            <BusinessPanel locale={locale} />
          </>
        ) : (
          <>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-[20px] border border-white/10 bg-white/[0.035] p-3">
              <span className="text-[20px] font-extrabold text-white tabular-nums">{s.value}</span>
              <span className="text-[11px] leading-tight text-mute">{s.label}</span>
            </div>
          ))}
        </div>

        <Link href="/niveles" className="flex items-center justify-between rounded-full border border-gold/30 bg-gold/[0.07] px-4 py-2.5 text-[13px] font-semibold text-gold-soft">
          {p.commission(lvl.commission, lvl.name[locale])}
          <IconChevron size={16} className="text-gold-soft" />
        </Link>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold text-white">{p.upcoming}</h2>
          {UPCOMING.map((b) => {
            const c = getItem(b.service)!;
            return (
              <div key={b.client} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.035] p-2.5">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-[14px]">
                  <Image src={c.photo} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="flex min-w-0 grow flex-col">
                  <span className="truncate text-[15px] font-bold text-white">{b.client}</span>
                  <span className="truncate text-[12px] text-mute">
                    {c.name[locale]} · {formatTime(b.time, locale)}
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${b.confirmed ? "bg-teal/15 text-teal" : "bg-gold/15 text-gold-soft"}`}>
                  {b.confirmed ? p.confirmed : p.pending}
                </span>
              </div>
            );
          })}
        </section>

          </>
        )}

        <SellerAi tone={business ? "business" : "lifestyle"} locale={locale} name={me.name} handle={me.handle} services={me.services.map((s) => ({ title: s.title[locale], price: s.price }))} />
      </div>

      <FeaturesFeed
        groups={groups}
        howItWorks={p.howItWorks}
        demo={{ chatUser: p.chatUser, chatArk: p.chatArk(formatPrice(me.services[1]?.price ?? me.services[0]?.price ?? 250, locale)), primary: p.seeReplies, secondary: p.changeTone }}
      />
    </div>
  );
}
