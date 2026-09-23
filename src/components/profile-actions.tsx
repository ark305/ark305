"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/locale";
import type { Mode } from "@/lib/mode";
import { savePref } from "@/lib/prefs";
import { IconChevron, IconClose, IconCopy, IconMenu } from "./icons";
import { ModeSwitch } from "./mode-switch";
import { useToast } from "./toast";

const pill = "glass flex h-11 min-w-0 items-center gap-2 rounded-full px-3.5 text-sm text-cream";

// Botón con el enlace del perfil: al tocarlo lo copia.
export function CopyLinkButton({ handle, copied, failed, label }: { handle: string; copied: string; failed: string; label: string }) {
  const { show } = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/@${handle}`);
      show(copied);
    } catch {
      show(failed);
    }
  }
  return (
    <button type="button" onClick={copy} className={pill} aria-label={`${label}: ark305.com/@${handle}`}>
      <span className="truncate">ark305.com/@{handle}</span> <IconCopy size={17} stroke="#EFE6D8" className="shrink-0" />
    </button>
  );
}

type MenuLabels = { menu: string; language: string; close: string; levels: string; label: string; buscar: string; ofrecer: string };

// Menú: modo (solo en tu perfil), niveles e idioma.
export function ProfileMenu({ locale, mode, labels }: { locale: Locale; mode: Mode | null; labels: MenuLabels }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function choose(l: Locale) {
    savePref("lang", l);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" aria-label={labels.menu} aria-expanded={open} onClick={() => setOpen(true)} className="glass flex size-11 shrink-0 items-center justify-center rounded-full">
        <IconMenu size={20} stroke="#EFE6D8" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label={labels.menu}
            className="w-full max-w-[430px] rounded-t-[28px] border-t border-line bg-card px-5 pt-5"
            style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line-2" />
            {mode && (
              <>
                <p className="mb-3 text-sm font-semibold text-mute">{labels.label}</p>
                <ModeSwitch mode={mode} labels={labels} />
                <Link href="/niveles" onClick={() => setOpen(false)} className="mt-3 flex h-12 items-center justify-between rounded-full border border-white/10 px-5 text-[15px] font-semibold text-cream">
                  {labels.levels} <IconChevron size={18} stroke="#9A9EA6" />
                </Link>
                <div className="my-5 h-px bg-white/10" />
              </>
            )}
            <p className="mb-3 text-sm font-semibold text-mute">{labels.language}</p>
            <div className="flex gap-2">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => choose(l)}
                  aria-pressed={locale === l}
                  className={`h-12 flex-1 rounded-full text-[15px] font-bold ${locale === l ? "bg-cream text-ink" : "border border-line text-cream"}`}
                >
                  {l === "es" ? "Español" : "English"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="mt-4 h-11 w-full text-sm font-semibold text-mute">
              {labels.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Tarjeta que se puede cerrar con la X (por ahora solo mientras la página está abierta).
export function Dismissible({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className={`relative ${className ?? ""}`}>
      {children}
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(false)}
        className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10"
      >
        <IconClose size={18} stroke="#EFE6D8" />
      </button>
    </div>
  );
}
