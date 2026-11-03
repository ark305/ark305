import type { Metadata } from "next";
import { TeamBuilder } from "@/components/team-builder";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.team };
}

export default async function TeamPage() {
  const { locale, level } = await getContext();
  return <TeamBuilder locale={locale} canHire={level !== "personal"} />;
}
