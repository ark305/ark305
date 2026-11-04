"use client";

import type { Answers } from "@/lib/diagnosis";
import type { Locale } from "@/lib/locale";
import { DiagnosisChat } from "./diagnosis-chat";

export function DiagnosisGate({ locale, userId, initialAnswers }: {
  locale: Locale;
  userId: string;
  initialAnswers?: Answers | null;
}) {
  return <DiagnosisChat locale={locale} userId={userId} initialAnswers={initialAnswers} />;
}
