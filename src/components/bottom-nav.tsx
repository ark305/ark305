"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Level, Side } from "@/lib/mode";
import { IconCap, IconCrown, IconSearch, IconSparkle } from "./icons";
import { Photo } from "./photo";

type Labels = { label: string; profile: string; home: string; panel: string; discover: string; talent: string; academy: string; ai: string };
type Tab = "profile" | "home" | "ai" | "search" | "academy";

// Barra de abajo:
// Personal → Perfil · Inicio · ARK IA (Mi día) · Descubrir · Academia (turquesa)
// Business → Perfil · Inicio del negocio · ARK IA (equipo) · Talento · Academia (dorado)
export function BottomNav({ labels, avatar, name, handle, side, level }: { labels: Labels; avatar: string | null; name: string; handle: string | null; side: Side; level: Level }) {
  const path = usePathname();
  const biz = side === "business";
  const first = path.split("/")[1];

  const active: Tab | null =
    path === "/" || first === "panel" || first === "documentos" || first === "revender" || first === "ganar" || first === "crear"
      ? "home"
      : first === "perfil" || first === "snapshot" || (handle && path === `/@${handle}`)
        ? "profile"
        : first === "mi-dia" || first === "equipo" || first === "diagnostico"
          ? "ai"
          : first === "descubrir" || first === "talento" || first === "autos" || first === "delivery"
            ? "search"
            : first === "academia"
              ? "academy"
              : null;

  const slot = (on: boolean) =>
    `flex h-14 items-center justify-center rounded-[28px] transition-[width,background-color] duration-300 ${on ? "w-[84px] bg-white/[0.12]" : "w-14"}`;
  const link = (tab: Tab, href: string, label: string, children: React.ReactNode) => (
    <Link href={href} aria-label={label} aria-current={active === tab ? "page" : undefined} className={slot(active === tab)}>
      {children}
    </Link>
  );

  return (
    <nav
      aria-label={labels.label}
      className="glass fixed inset-x-0 z-40 mx-auto flex h-[72px] w-[calc(100%-32px)] max-w-[398px] items-center justify-between rounded-[36px] px-2.5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.8)]"
      style={{ bottom: "calc(18px + env(safe-area-inset-bottom))" }}
    >
      {link(
        "profile",
        "/perfil",
        labels.profile,
        <span className="gold-grad relative size-[36px] rounded-full p-[2px]">
          <span className="relative block size-full overflow-hidden rounded-full">
            <Photo src={avatar} name={name} sizes="36px" />
          </span>
          {level === "vip" && (
            <span className="absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full bg-[#D8B170] ring-2 ring-ink">
              <IconCrown size={11} stroke="#08090B" weight={2.2} />
            </span>
          )}
        </span>,
      )}
      {link(
        "home",
        biz ? "/panel" : "/",
        biz ? labels.panel : labels.home,
        <span className="gold-grad flex size-8 items-center justify-center rounded-[9px] font-display text-[17px] font-semibold text-ink">A</span>,
      )}
      <Link href={biz ? "/equipo" : "/mi-dia"} aria-label={labels.ai} aria-current={active === "ai" ? "page" : undefined} className="flex size-14 items-center justify-center">
        <span className="gold-grad flex size-[50px] items-center justify-center rounded-full shadow-[0_8px_24px_-8px_var(--accent)]">
          <IconSparkle stroke="#08090B" weight={2} />
        </span>
      </Link>
      {link("search", biz ? "/talento" : "/descubrir", biz ? labels.talent : labels.discover, <IconSearch size={26} stroke="#EFE6D8" weight={1.9} />)}
      {link("academy", "/academia", labels.academy, <IconCap size={26} stroke="#EFE6D8" weight={1.7} />)}
    </nav>
  );
}
