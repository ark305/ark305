"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { saveExperience } from "@/lib/actions";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import type { Experience } from "@/lib/mode";
import { taste } from "@/lib/taste";
import { IconCheck } from "./icons";
import { useToast } from "./toast";

const PHOTOS: Record<Experience, string[]> = {
  lifestyle: ["https://images.unsplash.com/photo-1611042420087-4b643283fd5d"],
  business: ["https://images.unsplash.com/photo-1622675363311-3e1904dc1885"],
  both: ["https://images.unsplash.com/photo-1611042420087-4b643283fd5d", "https://images.unsplash.com/photo-1622675363311-3e1904dc1885"],
};
const COLOR: Record<Experience, string> = { lifestyle: "#D8B170", business: "#8FB0D0", both: "#EFE6D8" };

// Tres tarjetas grandes: Lifestyle, Business o las dos.
export function ExperienceCards({ locale, value, onPick }: { locale: Locale; value: Experience | null; onPick: (e: Experience) => void }) {
  const t = dict(locale).exp;
  return (
    <div className="flex flex-col gap-3">
      {(["lifestyle", "business", "both"] as Experience[]).map((e) => {
        const on = value === e;
        return (
          <button
            key={e}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(e)}
            className="relative flex h-[118px] items-end overflow-hidden rounded-[24px] border-2 p-4 text-left transition-colors"
            style={{ borderColor: on ? COLOR[e] : "rgb(255 255 255 / 0.08)" }}
          >
            <span className="absolute inset-0 flex">
              {PHOTOS[e].map((src) => (
                <span key={src} className="relative grow">
                  <Image src={src} alt="" fill sizes="400px" className="object-cover" />
                </span>
              ))}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
            <span className="relative flex grow flex-col">
              <span className="text-xl font-extrabold" style={{ color: COLOR[e] }}>
                {t[e].title}
              </span>
              <span className="text-[13px] leading-snug text-cream/85">{t[e].sub}</span>
            </span>
            {on && (
              <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full" style={{ background: COLOR[e] }}>
                <IconCheck size={15} stroke="#08090B" weight={2.6} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Primera visita: pantalla completa para elegir la experiencia.
export function ExperienceGate({ locale }: { locale: Locale }) {
  const t = dict(locale).exp;
  const [value, setValue] = useState<Experience | null>(null);
  const [pending, start] = useTransition();
  return (
    <div role="dialog" aria-modal="true" aria-label={t.question} className="fixed inset-0 z-[60] overflow-y-auto bg-ink">
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col gap-5 px-5 pt-12 pb-10">
        <p className="font-display text-[30px] leading-none font-semibold text-white">
          ARK<span className="text-gold">305</span>
        </p>
        <div>
          <h1 className="font-display text-[36px] leading-[1.05] font-semibold text-white">{t.question}</h1>
          <p className="mt-2 text-[15px] text-mute">{t.sub}</p>
        </div>
        <ExperienceCards locale={locale} value={value} onPick={setValue} />
        <button
          type="button"
          disabled={!value || pending}
          onClick={() => value && start(() => saveExperience(value))}
          className="mt-auto h-[52px] rounded-full bg-cream text-base font-bold text-ink disabled:opacity-40"
        >
          {t.continue}
        </button>
      </div>
    </div>
  );
}

// En el perfil: ver y cambiar la experiencia.
export function ExperienceSetting({ locale, value }: { locale: Locale; value: Experience | null }) {
  const t = dict(locale).exp;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-3.5 text-left">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15">
          <span className="size-3 rounded-full bg-gold" />
        </span>
        <span className="flex grow flex-col">
          <span className="text-[12px] text-mute">{t.yours}</span>
          <span className="text-base font-bold text-white">{value ? t[value].title : "—"}</span>
        </span>
        <span className="text-[13px] font-semibold text-cream/80">{t.change}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label={t.question}
            className="w-full max-w-[430px] rounded-t-[28px] border-t border-line bg-card px-5 pt-5"
            style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-extrabold text-white">{t.question}</h2>
            <ExperienceCards
              locale={locale}
              value={value}
              onPick={(e) =>
                start(async () => {
                  await saveExperience(e);
                  setOpen(false);
                })
              }
            />
            {pending && <p className="mt-3 text-center text-sm text-mute">…</p>}
          </div>
        </div>
      )}
    </>
  );
}

// Borra lo que el feed aprendió (temas, guardados y ocultos).
export function ResetTaste({ locale }: { locale: Locale }) {
  const t = dict(locale).feed;
  const { show } = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        taste.reset();
        show(t.resetDone);
      }}
      className="h-11 rounded-full border border-white/10 text-[13px] font-semibold text-mute"
    >
      {t.reset}
    </button>
  );
}
