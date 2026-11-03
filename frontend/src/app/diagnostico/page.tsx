import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DiagnosisGate } from "@/components/diagnosis-gate";
import { getContext, getDictionary } from "@/lib/i18n";
import { sanitize, type Answers } from "@/lib/diagnosis";
import { getViewer } from "@/lib/profiles-db";
import { supabaseReady } from "@/lib/supabase/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.diag.title };
}

export default async function DiagnosisPage() {
  const { locale, t } = await getContext();
  if (!supabaseReady) {
    return (
      <div className="px-5 pt-10">
        <h1 className="font-display text-[32px] font-semibold text-white">{t.diag.title}</h1>
        <p role="status" className="mt-3 text-sm text-mute">{t.diag.aiUnavailable}</p>
      </div>
    );
  }

  const viewer = await getViewer();
  if (!viewer.userId) redirect("/entrar?next=%2Fdiagnostico");
  if (!viewer.row) redirect("/bienvenida");

  const stored = viewer.row.diagnosis;
  const initialAnswers = stored && typeof stored === "object" && "answers" in stored
    ? sanitize((stored as Record<string, unknown>).answers)
    : null;
  return <DiagnosisGate locale={locale} userId={viewer.userId} initialAnswers={initialAnswers as Answers | null} />;
}
