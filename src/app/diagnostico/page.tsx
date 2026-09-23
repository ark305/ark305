import type { Metadata } from "next";
import { DiagnosisChat } from "@/components/diagnosis-chat";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.diag.title };
}

// Rehacer el Diagnóstico ARK cuando quieras.
export default async function DiagnosisPage() {
  const { locale } = await getDictionary();
  return <DiagnosisChat locale={locale} />;
}
