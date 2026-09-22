import Link from "next/link";
import { getDictionary } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-32 text-center">
      <p className="font-display text-3xl font-semibold text-white">ARK305</p>
      <p className="text-base text-mute">{t.profile.notFound}</p>
      <Link href="/descubrir" className="flex h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-ink">
        {t.nav.discover}
      </Link>
    </div>
  );
}
