import type { Metadata } from "next";
import { DayPlanner } from "@/components/day-planner";
import { getContext, getDictionary } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.day };
}

export default async function MyDayPage({ searchParams }: PageProps<"/mi-dia">) {
  const { locale, level } = await getContext();
  const { q } = await searchParams;
  const info = getLevel(level);
  return <DayPlanner locale={locale} discount={info.discount} levelName={info.name[locale]} initialPrompt={typeof q === "string" ? q.slice(0, 200) : ""} />;
}
