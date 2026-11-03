"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Level } from "@/lib/mode";
import { savePref } from "@/lib/prefs";
import { useToast } from "./toast";

// Cambia de nivel en modo demo (sin cobro).
export function LevelButton({ level, label, done, className }: { level: Level; label: string; done: string; className: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        savePref("nivel", level);
        start(() => router.refresh());
        show(done);
      }}
      className={`${className} disabled:opacity-60`}
    >
      {label}
    </button>
  );
}
