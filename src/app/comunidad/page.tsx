import type { Metadata } from "next";
import { CommunityView } from "@/components/community-view";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.community };
}

export default async function CommunityPage() {
  const { locale } = await getDictionary();
  return <CommunityView locale={locale} />;
}
