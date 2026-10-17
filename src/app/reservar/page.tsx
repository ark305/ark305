import type { Metadata } from "next";
import Link from "next/link";
import { BookingApp } from "@/components/booking-app";
import { SERVICE_TYPES, type ServiceType } from "@/lib/booking";
import { getContext, getDictionary } from "@/lib/i18n";
import { supabaseReady } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.book.title };
}

// Reservas reales (Supabase) con respaldo demo si la base no está configurada.
export default async function BookPage({ searchParams }: PageProps<"/reservar">) {
  const { locale, t } = await getContext();
  const { tipo } = await searchParams;
  const initialType = SERVICE_TYPES.includes(tipo as ServiceType) ? (tipo as ServiceType) : "all";
  let signedIn = false;
  if (supabaseReady) {
    const { data } = await (await createClient()).auth.getUser();
    signedIn = Boolean(data.user);
  }
  const { title, intro, ...labels } = t.book;
  return (
    <div className="flex flex-col gap-5 px-5 pt-8 pb-28">
      <div>
        <p className="text-[12px] font-bold tracking-[0.14em] text-gold-soft uppercase">ARK Concierge</p>
        <h1 className="mt-1 font-display text-[34px] leading-[1.05] font-semibold text-white">{title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-cream/80">{intro}</p>
        <Link href={`/mapa?capa=provider${initialType === "all" ? "" : `&servicio=${initialType}`}`} className="mt-2 inline-block text-[13px] font-bold text-gold-soft">
          {t.map.seeOnMap}
        </Link>
      </div>
      <BookingApp labels={labels} locale={locale} signedIn={signedIn} initialType={initialType} />
    </div>
  );
}
