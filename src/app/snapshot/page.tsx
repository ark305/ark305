import type { Metadata } from "next";
import { SnapshotView } from "@/components/snapshot-view";
import { sanitize } from "@/lib/diagnosis";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.snap.title };
}

export default async function SnapshotPage() {
  const { locale, diagnosis } = await getContext();
  const answers = diagnosis && typeof diagnosis === "object" && "answers" in diagnosis ? sanitize(diagnosis.answers) : null;
  return <SnapshotView locale={locale} fromAccount={answers?.who ? answers : null} />;
}
