"use client";

import { useState } from "react";
import { IconArrow, IconSparkle } from "./icons";
import { SoonButton } from "./toast";

export type Feature = { key: string; label: string; color: string };

type ConciergeText = {
  doIt: string;
  count: string;
  chatUser: string;
  chatArk: { before: string; total: string; after: string };
  bookAll: string;
  changeChef: string;
  tagline: string;
  body: string;
  howItWorks: string;
  soon: string;
};

// Inicio: la tira de colores arriba elige la función. Por ahora solo el Concierge IA tiene contenido.
export function FeaturesStrip({ features, text }: { features: Feature[]; text: ConciergeText }) {
  const [selected, setSelected] = useState("concierge");
  const current = features.find((f) => f.key === selected)!;

  return (
    <>
      <header className="sticky top-0 z-10 h-[118px] border-b border-line bg-ink-2 px-5 pt-6">
        <div className="flex h-[46px] items-center gap-[5px]">
          {features.map((f) => {
            const on = f.key === selected;
            return (
              <button
                key={f.key}
                type="button"
                aria-label={f.label}
                aria-pressed={on}
                onClick={() => setSelected(f.key)}
                className={`grow rounded-lg transition-all duration-200 ${on ? "h-11 border-2 border-white opacity-100" : "h-[30px] opacity-55"}`}
                style={{ background: f.color }}
              />
            );
          })}
        </div>
        <p className="mt-3 text-sm font-semibold text-mute">{current.label}</p>
      </header>

      <div className="flex flex-col gap-[18px] px-5 pt-[26px]">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-[28px] font-semibold text-white">{text.doIt}</h1>
          <span className="text-sm text-mute">{text.count}</span>
        </div>

        {selected === "concierge" ? (
          <>
            <div className="flex h-[290px] flex-col justify-center gap-3 rounded-[26px] border border-[#1f3432] bg-[#0f1b1a] p-[22px]">
              <p className="max-w-[250px] self-end rounded-[18px_18px_4px_18px] bg-cream px-3.5 py-3 text-sm leading-[1.45] text-ink">{text.chatUser}</p>
              <p className="max-w-[270px] self-start rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep px-3.5 py-3 text-sm leading-normal text-cream">
                {text.chatArk.before}
                <strong>{text.chatArk.total}</strong>
                {text.chatArk.after}
              </p>
              <div className="flex gap-2 self-start">
                <SoonButton className="flex h-[34px] items-center rounded-full bg-teal px-3.5 text-[13px] font-bold text-ink">{text.bookAll}</SoonButton>
                <SoonButton className="flex h-[34px] items-center rounded-full border border-teal-line px-3.5 text-[13px] text-cream">{text.changeChef}</SoonButton>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="flex size-[50px] items-center justify-center rounded-[14px] bg-teal-deep">
                <IconSparkle stroke="#7FC2B7" />
              </span>
              <span className="text-[26px] font-extrabold text-white">{current.label}</span>
            </div>
            <p className="-mt-1 text-xl font-bold text-teal">{text.tagline}</p>
            <p className="text-base leading-[1.55] text-mute">{text.body}</p>
            <SoonButton className="flex h-11 items-center gap-2 self-start text-base font-bold text-teal">
              {text.howItWorks} <IconArrow size={18} stroke="#7FC2B7" />
            </SoonButton>
          </>
        ) : (
          <div className="flex h-[290px] flex-col items-center justify-center gap-3 rounded-[26px] border border-line bg-card p-[22px] text-center">
            <span className="size-12 rounded-[14px]" style={{ background: current.color }} />
            <span className="text-[26px] font-extrabold text-white">{current.label}</span>
            <span className="text-base text-mute">{text.soon}</span>
          </div>
        )}
      </div>
    </>
  );
}
