"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { saveSide } from "@/lib/actions";
import { SIDE_HOME, type Side } from "@/lib/mode";

// Transición suave (300 ms) al cambiar de Personal a Business: se desvanece y vuelve.
function fadeOut() {
  const main = document.querySelector("main");
  if (!main) return;
  main.style.transition = "opacity 150ms ease";
  main.style.opacity = "0";
}

// Vuelve a mostrar la pantalla cuando ya cambió el lado (va en el layout).
export function SideFade({ side }: { side: string }) {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    main.style.transition = "opacity 150ms ease";
    main.style.opacity = "1";
  }, [side]);
  return null;
}

type Labels = { label: string; personal: string; business: string };

// Interruptor único: Personal (turquesa) ↔ Business (dorado).
export function SideSwitch({ side, labels, className = "" }: { side: Side; labels: Labels; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: Side) {
    if (next === side) return;
    fadeOut();
    start(async () => {
      await saveSide(next);
      router.push(SIDE_HOME[next]);
    });
  }

  return (
    <div role="radiogroup" aria-label={labels.label} className={`glass relative grid h-12 grid-cols-2 rounded-full p-1 ${pending ? "opacity-80" : ""} ${className}`}>
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ${side === "business" ? "translate-x-full bg-[#D8B170]" : "bg-[#7FC2B7]"}`}
      />
      {(["personal", "business"] as const).map((s) => (
        <button key={s} type="button" role="radio" aria-checked={side === s} onClick={() => choose(s)} className={`relative z-10 rounded-full text-[15px] font-bold ${side === s ? "text-ink" : "text-cream/80"}`}>
          {labels[s]}
        </button>
      ))}
    </div>
  );
}

// Píldora chica para el Inicio: "Business →" o "Personal →".
export function SidePill({ side, label }: { side: Side; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next: Side = side === "business" ? "personal" : "business";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        fadeOut();
        start(async () => {
          await saveSide(next);
          router.push(SIDE_HOME[next]);
        });
      }}
      className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold text-ink ${next === "business" ? "bg-[#D8B170]" : "bg-[#7FC2B7]"}`}
    >
      {label} →
    </button>
  );
}
