import type { Metadata } from "next";
import { IconCheck, IconCrown } from "@/components/icons";
import { LevelButton } from "@/components/level-button";
import { getContext, getDictionary } from "@/lib/i18n";
import { levels } from "@/lib/levels";
import { LEVEL_COLOR } from "@/lib/mode";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.levels.title };
}

export default async function LevelsPage() {
  const { locale, t, level } = await getContext();
  const l = t.levels;

  return (
    <div className="flex flex-col gap-5 px-4 pt-8">
      <header>
        <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-white">{l.title}</h1>
        <p className="mt-2 text-base leading-normal text-mute">{l.intro}</p>
      </header>

      {levels.map((info) => {
        const vip = info.id === "vip";
        const current = info.id === level;
        const color = LEVEL_COLOR[info.id];
        return (
          <section
            key={info.id}
            className={`relative flex flex-col gap-4 overflow-hidden rounded-[28px] border p-5 ${vip ? "border-gold/45 bg-gradient-to-br from-[#2a2217] via-[#141210] to-ink" : "border-white/10 bg-white/[0.035]"}`}
            style={{ boxShadow: current ? `0 0 0 2px ${color}, 0 30px 80px -40px ${color}` : vip ? "0 30px 80px -40px #d8b17099" : undefined }}
          >
            <div>
              <h2 className={`flex items-center gap-2 font-display text-[30px] leading-tight font-semibold ${vip ? "text-gold-soft" : "text-white"}`}>
                {vip && <IconCrown size={24} stroke="#EBD3A0" weight={1.8} />}
                {info.name[locale]}
              </h2>
              <p className="mt-1 text-xl font-extrabold" style={{ color }}>
                {info.price[locale]}
              </p>
              <p className="mt-1 text-sm text-mute">{info.tagline[locale]}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
              {info.discount > 0 && <span className="rounded-full bg-white/[0.07] px-3 py-1 text-cream">{l.discount(info.discount)}</span>}
              <span className="rounded-full bg-white/[0.07] px-3 py-1 text-cream">{l.commission(info.commission)}</span>
            </div>

            <Perks title={l.whenBuscar} items={info.buscar.map((b) => b[locale])} color={color} />
            <Perks title={l.whenOfrecer} items={info.ofrecer.map((b) => b[locale])} color={color} />
            {info.extra && <Perks title={l.privateIncluded} items={info.extra.map((b) => b[locale])} color={color} gold />}

            {current ? (
              <p className="flex h-12 items-center justify-center rounded-full border border-white/15 text-[15px] font-bold text-cream">{l.current}</p>
            ) : (
              <LevelButton
                level={info.id}
                label={l.try(info.name[locale])}
                done={l.changed(info.name[locale])}
                className={`h-12 rounded-full text-[15px] font-bold text-ink ${vip ? "gold-grad" : "bg-cream"}`}
              />
            )}
          </section>
        );
      })}

      <p className="px-2 text-center text-[12px] text-mute">{l.demoNote}</p>
    </div>
  );
}

function Perks({ title, items, color, gold }: { title: string; items: string[]; color: string; gold?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={`text-[11px] font-bold tracking-[0.14em] uppercase ${gold ? "text-gold-soft" : "text-mute"}`}>{title}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-[15px] leading-snug text-cream/90">
            <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full" style={{ background: `${color}26` }}>
              <IconCheck size={12} stroke={color} weight={2.6} />
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
