"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MODE_HOME, type Mode } from "@/lib/mode";
import { savePref } from "@/lib/prefs";

// Interruptor Buscar | Ofrecer, como "Cambiar a modo anfitrión" en Airbnb.
export function ModeSwitch({ mode, labels, className = "" }: { mode: Mode; labels: { label: string; buscar: string; ofrecer: string }; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: Mode) {
    if (next === mode) return;
    savePref("mode", next);
    start(() => {
      router.push(MODE_HOME[next]);
      router.refresh();
    });
  }

  return (
    <div role="radiogroup" aria-label={labels.label} className={`glass relative grid h-12 grid-cols-2 rounded-full p-1 ${pending ? "opacity-70" : ""} ${className}`}>
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ${
          mode === "ofrecer" ? "gold-grad translate-x-full" : "bg-cream"
        }`}
      />
      {(["buscar", "ofrecer"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => choose(m)}
          className={`relative z-10 rounded-full text-[15px] font-bold transition-colors ${mode === m ? "text-ink" : "text-cream/80"}`}
        >
          {labels[m]}
        </button>
      ))}
    </div>
  );
}
