import type { Metadata } from "next";
import Link from "next/link";
import { ClubApp } from "@/components/club-app";
import { clubs } from "@/lib/clubs";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.club.title };
}

// Modo membresía: el club de cada desarrollo, powered by ARK305 (demo).
export default async function ClubPage({ searchParams }: PageProps<"/club">) {
  const { locale, t } = await getContext();
  const { c } = await searchParams;
  const { title, intro, demoNote, ...labels } = t.club;
  const club = clubs.find((x) => x.slug === c) ?? clubs[0];
  return (
    <div className="flex flex-col gap-5 px-5 pt-8 pb-28">
      <div>
        <p className="text-[12px] font-bold tracking-[0.14em] text-gold-soft uppercase">ARK Clubs</p>
        <h1 className="mt-1 font-display text-[34px] leading-[1.05] font-semibold text-white">{title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-cream/80">{intro}</p>
        <Link href={`/mapa?capa=ally,residence&zona=${encodeURIComponent(club.hood)}`} className="mt-2 inline-block text-[13px] font-bold text-gold-soft">
          {t.map.seeOnMap}
        </Link>
      </div>
      <ClubApp initial={typeof c === "string" ? c : ""} labels={labels} locale={locale} />
      <p className="text-center text-[11px] text-mute">{demoNote}</p>
    </div>
  );
}
