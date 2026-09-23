"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconArrow,
  IconCalendar,
  IconCap,
  IconChart,
  IconCrown,
  IconPeople,
  IconScooter,
  IconSparkle,
  IconSun,
  IconTicket,
} from "./icons";
import { SoonButton } from "./toast";

const ICONS = {
  concierge: IconSparkle,
  bookings: IconCalendar,
  myDay: IconSun,
  delivery: IconScooter,
  talent: IconPeople,
  teams: IconPeople,
  events: IconTicket,
  pass: IconCrown,
  academy: IconCap,
  analytics: IconChart,
};

export type FeatureKey = keyof typeof ICONS;
export type Feature = { key: FeatureKey; label: string; tagline: string; body: string; color: string };
export type FeatureGroup = { title: string; count: string; items: Feature[] };
type DemoText = { chatUser: string; chatArk: { before: string; total: string; after: string }; bookAll: string; changeChef: string };

// Inicio: tira de colores arriba + una tarjeta grande por función.
// Al bajar, la tira marca la función que estás viendo; al tocar un color, te lleva a ella.
export function FeaturesFeed({ groups, demo, howItWorks }: { groups: FeatureGroup[]; demo: DemoText; howItWorks: string }) {
  const all = groups.flatMap((g) => g.items);
  const [active, setActive] = useState<FeatureKey>(all[0].key);
  const refs = useRef<Partial<Record<FeatureKey, HTMLElement | null>>>({});
  const current = all.find((f) => f.key === active)!;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.getAttribute("data-key") as FeatureKey);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    Object.values(refs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function jump(key: FeatureKey) {
    setActive(key);
    refs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink/75 px-5 pt-6 pb-3 backdrop-blur-xl">
        <div className="flex h-11 items-center gap-[5px]">
          {all.map((f) => {
            const on = f.key === active;
            return (
              <button
                key={f.key}
                type="button"
                aria-label={f.label}
                aria-pressed={on}
                onClick={() => jump(f.key)}
                className={`grow rounded-lg transition-all duration-300 ${on ? "h-11" : "h-[30px] opacity-50"}`}
                style={{ background: f.color, boxShadow: on ? `0 0 22px ${f.color}aa, inset 0 0 0 1.5px rgb(255 255 255 / 0.55)` : undefined }}
              />
            );
          })}
        </div>
        <p className="mt-2.5 text-sm font-semibold text-mute transition-colors">{current.label}</p>
      </header>

      <div className="flex flex-col gap-12 px-5 pt-7">
        {groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-10">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[28px] font-semibold text-white">{g.title}</h2>
              <span className="text-sm text-mute">{g.count}</span>
            </div>
            {g.items.map((f) => {
              const Icon = ICONS[f.key];
              return (
                <article
                  key={f.key}
                  data-key={f.key}
                  ref={(el) => {
                    refs.current[f.key] = el;
                  }}
                  className="flex scroll-mt-[128px] flex-col gap-4"
                >
                  <div
                    className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-[28px] border"
                    style={{
                      borderColor: `${f.color}40`,
                      background: `radial-gradient(110% 85% at 50% 42%, ${f.color}5c 0%, ${f.color}1f 45%, #0b0c0f 88%)`,
                      boxShadow: `0 30px 80px -40px ${f.color}99, inset 0 1px 0 ${f.color}33`,
                    }}
                  >
                    {f.key === "concierge" ? (
                      <ConciergeDemo demo={demo} color={f.color} />
                    ) : (
                      <span style={{ filter: `drop-shadow(0 0 22px ${f.color})` }}>
                        <Icon size={84} stroke="#FFFFFF" weight={1.4} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3.5 pt-1">
                    <span className="flex size-[52px] items-center justify-center rounded-[15px]" style={{ background: `${f.color}22` }}>
                      <Icon size={26} stroke={f.color} weight={1.9} />
                    </span>
                    <h3 className="text-[26px] font-extrabold text-white">{f.label}</h3>
                  </div>
                  <p className="text-xl leading-snug font-bold" style={{ color: f.color }}>
                    {f.tagline}
                  </p>
                  <p className="line-clamp-3 text-base leading-[1.55] text-mute">{f.body}</p>
                  <SoonButton className="flex h-9 items-center gap-2 self-start text-base font-bold" style={{ color: f.color }}>
                    {howItWorks} <IconArrow size={18} stroke={f.color} />
                  </SoonButton>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}

function ConciergeDemo({ demo, color }: { demo: DemoText; color: string }) {
  return (
    <div className="flex w-full flex-col gap-3 p-[22px]">
      <p className="max-w-[250px] self-end rounded-[18px_18px_4px_18px] bg-cream px-3.5 py-3 text-sm leading-[1.45] text-ink shadow-lg">{demo.chatUser}</p>
      <p className="max-w-[270px] self-start rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep/90 px-3.5 py-3 text-sm leading-normal text-cream backdrop-blur">
        {demo.chatArk.before}
        <strong>{demo.chatArk.total}</strong>
        {demo.chatArk.after}
      </p>
      <div className="flex gap-2 self-start">
        <SoonButton className="flex h-[34px] items-center rounded-full px-3.5 text-[13px] font-bold text-ink" style={{ background: color }}>
          {demo.bookAll}
        </SoonButton>
        <SoonButton className="flex h-[34px] items-center rounded-full border border-teal-line px-3.5 text-[13px] text-cream">{demo.changeChef}</SoonButton>
      </div>
    </div>
  );
}
