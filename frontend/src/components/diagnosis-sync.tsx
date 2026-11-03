"use client";

import { useEffect } from "react";
import { saveDiagnosis } from "@/lib/actions";
import type { Answers } from "@/lib/diagnosis";
import { useLocalDiagnosis, writeDiagnosis } from "@/lib/diagnosis-store";

// Mantiene el Diagnóstico igual en el teléfono y en la cuenta:
// si lo hiciste como invitado, lo sube; si entras en un teléfono nuevo, lo trae.
export function DiagnosisSync({ fromAccount }: { fromAccount: Answers | null }) {
  const local = useLocalDiagnosis();
  useEffect(() => {
    if (!fromAccount?.who && local?.who) saveDiagnosis(local, false);
    else if (fromAccount?.who && !local?.who) writeDiagnosis(fromAccount);
  }, [local, fromAccount]);
  return null;
}
