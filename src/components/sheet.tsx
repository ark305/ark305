"use client";

import { useEffect } from "react";
import { IconClose } from "./icons";

// Hoja que sube desde abajo (como en Descubrir). Se cierra tocando afuera, con la X o con Esc.
export function Sheet({ label, closeLabel, onClose, children }: { label: string; closeLabel: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative flex max-h-[88dvh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto *:shrink-0 rounded-t-[28px] border-t border-line bg-card px-5 pt-5"
        style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10">
          <IconClose size={18} stroke="#EFE6D8" weight={2} />
        </button>
        {children}
      </div>
    </div>
  );
}
