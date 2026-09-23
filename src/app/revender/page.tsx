import type { Metadata } from "next";
import { ResaleBuilder } from "@/components/resale-builder";
import { getContext, getDictionary } from "@/lib/i18n";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";
import { getViewer } from "@/lib/profiles-db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.resell };
}

// Revender es parte del nivel Pro (y VIP).
export default async function ResellPage() {
  const { locale, level } = await getContext();
  const me = (await getViewer()).profile ?? getProfile(CURRENT_HANDLE)!;
  return <ResaleBuilder locale={locale} canSell={level !== "personal"} brandName={me.name} />;
}
