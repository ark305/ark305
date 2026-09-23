import Link from "next/link";
import type { ComponentType } from "react";
import { IconChevron } from "./icons";
import { SoonButton } from "./toast";

type IconType = ComponentType<{ size?: number; stroke?: string; weight?: number }>;
export type Option = { key: string; title: string; sub: string; color: string; Icon: IconType; href?: string };

// Lista de opciones con ícono de color (pantallas "Gana dinero" y "Crear").
export function OptionList({ title, intro, options }: { title: string; intro: string; options: Option[] }) {
  return (
    <div className="flex flex-col px-[22px] pt-[30px]">
      <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-white">{title}</h1>
      <p className="mt-2.5 mb-3.5 text-base leading-normal text-mute">{intro}</p>
      {options.map(({ key, title, sub, color, Icon, href }) => {
        const inner = (
          <>
            <span className="gloss flex size-[60px] shrink-0 items-center justify-center rounded-[18px]" style={{ "--c": color } as React.CSSProperties}>
              <Icon size={28} stroke="#FFFFFF" weight={2} />
            </span>
            <span className="flex grow flex-col gap-[3px] border-b border-white/[0.07] pb-3.5">
              <span className="text-lg font-bold text-white">{title}</span>
              <span className="text-sm leading-[1.4] text-mute">{sub}</span>
            </span>
            <IconChevron size={20} stroke="#9A9EA6" />
          </>
        );
        const cls = "flex items-center gap-4 py-3 text-left text-cream";
        return href ? (
          <Link key={key} href={href} className={cls}>
            {inner}
          </Link>
        ) : (
          <SoonButton key={key} className={cls}>
            {inner}
          </SoonButton>
        );
      })}
    </div>
  );
}
