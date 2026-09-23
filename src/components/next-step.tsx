"use client";

import Link from "next/link";
import { buildSnapshot, sanitize } from "@/lib/diagnosis";
import { useLocalDiagnosis } from "@/lib/diagnosis-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { IconArrow, IconSparkle } from "./icons";

// Tarjeta de Inicio: tu próximo paso según el ARK Snapshot (o invitación a hacer el Diagnóstico).
export function NextStep({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const local = useLocalDiagnosis();
  const snap = local ? buildSnapshot(sanitize(local)) : null;
  const action = snap?.actions[0];
  return (
    <Link href={action ? action.href : "/diagnostico"} className="mx-4 flex items-center gap-3 rounded-[20px] border border-gold/30 bg-gold/[0.06] p-3.5">
      <span className="gold-grad flex size-10 shrink-0 items-center justify-center rounded-full">
        <IconSparkle size={18} stroke="#08090B" weight={2} />
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="text-[12px] font-semibold text-gold">{t.diag.cardTitle}</span>
        <span className="truncate text-[15px] font-bold text-white">{action ? action.label[locale] : t.diag.start}</span>
      </span>
      <IconArrow size={18} className="shrink-0 text-gold" />
    </Link>
  );
}
