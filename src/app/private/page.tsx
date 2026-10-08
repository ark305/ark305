import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IconCrown, IconLock } from "@/components/icons";
import { Photo } from "@/components/photo";
import { PrivateGate } from "@/components/private-gate";
import { ResidenceCards } from "@/components/residence-cards";
import { ToastButton } from "@/components/toast";
import { getContext, getDictionary } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";
import { CURRENT_HANDLE, getProfile, profiles } from "@/lib/mock-data";
import { getViewer } from "@/lib/profiles-db";
import { privateServices, residences } from "@/lib/private";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.private.title };
}

const HERO = "https://images.unsplash.com/photo-1774423864869-702b21c2490a";

// ARK Private: incluido en Súper Premium VIP. Sin ese nivel se ve la puerta de entrada.
export default async function PrivatePage() {
  const { locale, t, level } = await getContext();
  const p = t.private;
  const me = (await getViewer()).profile ?? getProfile(CURRENT_HANDLE)!;

  if (level !== "vip") {
    const perks = getLevel("vip").extra!;
    return (
      <div className="flex flex-col">
        <section className="relative flex h-[360px] flex-col items-center justify-end gap-3 overflow-hidden px-6 pb-8 text-center">
          <Image src={HERO} alt="" fill priority sizes="430px" className="scale-110 object-cover blur-md brightness-50" />
          <div className="fade-bottom absolute inset-0" />
          <span className="gold-grad relative flex size-14 items-center justify-center rounded-2xl">
            <IconLock size={26} stroke="#08090B" weight={2} />
          </span>
          <h1 className="relative font-display text-[40px] leading-none font-semibold text-gold-soft">{p.title}</h1>
          <p className="relative text-sm font-semibold text-gold">{p.includedIn}</p>
        </section>
        <div className="flex flex-col gap-5 px-5">
          <p className="text-center text-base leading-normal text-cream/85">{p.lockedSub}</p>
          <ul className="flex flex-col gap-2">
            {perks.map((k) => (
              <li key={k.es} className="flex items-center gap-3 rounded-[18px] border border-gold/20 bg-gold/[0.05] px-4 py-3 text-[15px] text-cream">
                <IconCrown size={16} stroke="#D8B170" weight={1.9} /> {k[locale]}
              </li>
            ))}
          </ul>
          <Link href="/niveles" className="gold-grad flex h-[52px] items-center justify-center rounded-full text-base font-bold text-ink">
            {p.upgrade}
          </Link>
          <PrivateGate labels={{ code: p.code, enter: p.enter, badCode: p.badCode, codeHint: p.codeHint, welcome: t.levels.changed(getLevel("vip").name[locale]) }} />
        </div>
      </div>
    );
  }

  const team = profiles.filter((x) => x.private);
  return (
    <div className="flex flex-col gap-7">
      <section className="relative flex h-[420px] flex-col justify-end gap-2 overflow-hidden px-5 pb-6">
        <Image src={HERO} alt="" fill priority sizes="430px" className="object-cover" />
        <div className="fade-bottom absolute inset-0" />
        <span className="relative flex w-fit items-center gap-1.5 rounded-full border border-gold/50 bg-black/40 px-3 py-1 text-[12px] font-bold text-gold-soft backdrop-blur">
          <IconCrown size={13} stroke="#EBD3A0" weight={2} /> {p.title}
        </span>
        <h1 className="relative font-display text-[38px] leading-[1.05] font-semibold text-white">{p.welcome(me.name)}</h1>
        <p className="relative text-[15px] leading-normal text-cream/80">{p.conciergeLine}</p>
      </section>

      <div className="no-scrollbar -mt-2 flex gap-2 overflow-x-auto px-5">
        {p.chips.map((c) => (
          <ToastButton key={c} message={p.requested} className="h-10 shrink-0 rounded-full border border-gold/30 bg-gold/[0.07] px-4 text-[13px] font-semibold text-gold-soft">
            {c}
          </ToastButton>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="px-5">
          <h2 className="font-display text-2xl font-semibold text-white">{p.residences}</h2>
          <p className="text-sm text-mute">{p.residencesSub}</p>
        </div>
        <ResidenceCards residences={residences} locale={locale} />
      </section>

      <section className="flex flex-col gap-4 px-5">
        <h2 className="font-display text-2xl font-semibold text-white">{p.services}</h2>
        {privateServices.map((g) => (
          <div key={g.title.es} className="flex flex-col">
            <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-gold-soft uppercase">{g.title[locale]}</p>
            {g.items.map((s) => (
              <ToastButton key={s.name.es} message={p.requested} className="flex items-center justify-between gap-3 border-b border-white/[0.07] py-3 text-left">
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-bold text-white">{s.name[locale]}</span>
                  <span className="text-[12px] text-mute">{s.desc[locale]}</span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-gold-soft">{s.price ? s.price[locale] : p.quote}</span>
              </ToastButton>
            ))}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 px-5">
        <h2 className="font-display text-2xl font-semibold text-white">{p.team}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {team.map((x) => (
            <Link key={x.handle} href={`/@${x.handle}`} className="relative flex h-[170px] flex-col justify-end overflow-hidden rounded-[22px] p-3">
              <Photo src={x.photo} name={x.name} sizes="200px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
              <span className="relative text-[15px] font-bold text-white">{x.name}</span>
              <span className="relative text-[12px] text-gold-soft">{x.role[locale]}</span>
            </Link>
          ))}
        </div>
        <ToastButton message={p.requested} className="gold-grad mt-2 h-[52px] rounded-full text-base font-bold text-ink">
          {p.writeConcierge}
        </ToastButton>
        <p className="text-center text-[11px] text-mute">{p.demoNote}</p>
      </section>
    </div>
  );
}
