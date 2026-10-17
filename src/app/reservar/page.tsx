import type { Metadata } from "next";
import { BookingApp } from "@/components/booking-app";
import { getContext, getDictionary } from "@/lib/i18n";
import { getSession } from "@/lib/archie/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.book.title };
}

// Reservas reales (Archie) con respaldo demo si Archie no está configurado.
export default async function BookPage() {
  const { locale, t } = await getContext();
  const signedIn = Boolean(await getSession());
  const { title, intro, ...labels } = t.book;
  return (
    <div className="flex flex-col gap-5 px-5 pt-8 pb-28">
      <div>
        <p className="text-[12px] font-bold tracking-[0.14em] text-gold-soft uppercase">ARK Concierge</p>
        <h1 className="mt-1 font-display text-[34px] leading-[1.05] font-semibold text-white">{title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-cream/80">{intro}</p>
      </div>
      <BookingApp labels={labels} locale={locale} signedIn={signedIn} />
    </div>
  );
}
