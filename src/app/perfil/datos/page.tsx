import type { Metadata } from "next";
import { KnowsView } from "@/components/knows-view";
import { sanitize } from "@/lib/diagnosis";
import { getContext, getDictionary } from "@/lib/i18n";
import { getViewer } from "@/lib/profiles-db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.knows.title };
}

export default async function KnowsPage() {
  const { locale, diagnosis, side } = await getContext();
  const viewer = await getViewer();
  const answers = diagnosis && typeof diagnosis === "object" && "answers" in diagnosis ? sanitize(diagnosis.answers) : null;
  return <KnowsView locale={locale} fromAccount={answers?.who ? answers : null} side={side} signedIn={!!viewer.userId} />;
}
