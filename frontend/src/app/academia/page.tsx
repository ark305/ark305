import type { Metadata } from "next";
import { CommunityView } from "@/components/community-view";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.academy };
}

// Academia (con Equipos, Grupos y Eventos de la comunidad).
export default async function AcademyPage() {
  const { locale } = await getDictionary();
  return <CommunityView locale={locale} />;
}
