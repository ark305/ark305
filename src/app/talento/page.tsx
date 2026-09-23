import type { Metadata } from "next";
import { TalentView } from "@/components/talent-view";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.talent.title };
}

// Talento es parte de Business (y de VIP, que incluye todo Business).
export default async function TalentPage() {
  const { locale, level } = await getContext();
  return <TalentView locale={locale} canHire={level !== "personal"} />;
}
