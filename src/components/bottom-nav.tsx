"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Level, Mode } from "@/lib/mode";
import { IconCrown, IconDollar, IconPeople, IconPlus, IconSearch, IconSparkle } from "./icons";

type Labels = { label: string; profile: string; home: string; panel: string; day: string; create: string; discover: string; earn: string; community: string };
type Tab = "profile" | "home" | "panel" | "day" | "create" | "discover" | "earn" | "community";

function activeTab(path: string, handle: string): Tab | null {
  if (path === "/") return "home";
  if (path === "/perfil" || path === `/@${handle}`) return "profile";
  const first = path.split("/")[1];
  const map: Record<string, Tab> = { panel: "panel", "mi-dia": "day", crear: "create", descubrir: "discover", ganar: "earn", comunidad: "community" };
  return map[first] ?? null; // el perfil de otra persona no marca ninguna pestaña
}

// Barra de abajo: cambia según el modo. Buscar en crema, Ofrecer en dorado.
export function BottomNav({ labels, avatar, handle, mode, level }: { labels: Labels; avatar: string; handle: string; mode: Mode; level: Level }) {
  const active = activeTab(usePathname(), handle);
  const offer = mode === "ofrecer";

  const slot = (on: boolean) =>
    `flex h-14 items-center justify-center rounded-[28px] transition-[width,background-color] duration-200 ${on ? "w-[84px] bg-white/[0.12]" : "w-14"}`;
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
        <span className={`relative size-[36px] rounded-full p-[2px] ${offer || level === "vip" ? "gold-grad" : "bg-cream"}`}>
          <span className="relative block size-full overflow-hidden rounded-full">
            <Image src={avatar} alt="" fill sizes="36px" className="object-cover" />
          </span>
          {level === "vip" && (
            <span className="gold-grad absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full ring-2 ring-ink">
              <IconCrown size={11} stroke="#08090B" weight={2.2} />
            </span>
          )}
        </span>,
      )}
      {link(
        offer ? "panel" : "home",
        offer ? "/panel" : "/",
        offer ? labels.panel : labels.home,
        <span className={`flex size-8 items-center justify-center rounded-[9px] font-display text-[17px] font-semibold text-ink ${offer ? "gold-grad" : "bg-cream"}`}>A</span>,
      )}
      <Link
        href={offer ? "/crear" : "/mi-dia"}
        aria-label={offer ? labels.create : labels.day}
        aria-current={active === (offer ? "create" : "day") ? "page" : undefined}
        className="flex size-14 items-center justify-center"
      >
        <span className={`flex size-[50px] items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)] ${offer ? "gold-grad" : "bg-cream"}`}>
          {offer ? <IconPlus stroke="#08090B" weight={2.2} /> : <IconSparkle stroke="#08090B" weight={2} />}
        </span>
      </Link>
      {offer
        ? link("earn", "/ganar", labels.earn, <IconDollar size={26} stroke="#EFE6D8" />)
        : link("discover", "/descubrir", labels.discover, <IconSearch size={26} stroke="#EFE6D8" weight={1.9} />)}
      {link("community", "/comunidad", labels.community, <IconPeople size={26} stroke="#EFE6D8" />)}
    </nav>
  );
}
