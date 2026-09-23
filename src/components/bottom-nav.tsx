"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconDollar, IconPlus, IconSearch } from "./icons";

type Labels = { label: string; profile: string; home: string; create: string; discover: string; earn: string };

export function BottomNav({ labels, avatar, handle }: { labels: Labels; avatar: string; handle: string }) {
  const path = usePathname();
  // El perfil de otra persona (/@alguien) no marca ninguna pestaña.
  const active =
    path === "/"
      ? "home"
      : path.startsWith("/descubrir")
        ? "discover"
        : path.startsWith("/ganar")
          ? "earn"
          : path.startsWith("/crear")
            ? "create"
            : path === "/perfil" || path === `/@${handle}`
              ? "profile"
              : null;
  const profileHref = "/perfil";

  const slot = (on: boolean) =>
    `flex h-14 items-center justify-center rounded-[28px] transition-[width,background-color] duration-200 ${
      on ? "w-[84px] bg-white/[0.12]" : "w-14"
    }`;

  return (
    <nav
      aria-label={labels.label}
      className="glass fixed inset-x-0 z-40 mx-auto flex h-[72px] w-[calc(100%-32px)] max-w-[398px] items-center justify-between rounded-[36px] px-2.5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.8)]"
      style={{ bottom: "calc(18px + env(safe-area-inset-bottom))" }}
    >
      <Link href={profileHref} aria-label={labels.profile} aria-current={active === "profile" ? "page" : undefined} className={slot(active === "profile")}>
        <span className="gold-grad relative size-[36px] rounded-full p-[2px]">
          <span className="relative block size-full overflow-hidden rounded-full">
            <Image src={avatar} alt="" fill sizes="36px" className="object-cover" />
          </span>
        </span>
      </Link>
      <Link href="/" aria-label={labels.home} aria-current={active === "home" ? "page" : undefined} className={slot(active === "home")}>
        <span className="gold-grad flex size-8 items-center justify-center rounded-[9px] font-display text-[17px] font-semibold text-ink">
          A
        </span>
      </Link>
      <Link href="/crear" aria-label={labels.create} aria-current={active === "create" ? "page" : undefined} className="flex size-14 items-center justify-center">
        <span className={`flex size-[50px] items-center justify-center rounded-full ${active === "create" ? "bg-gold" : "bg-cream"}`}>
          <IconPlus stroke="#08090B" weight={2.2} />
        </span>
      </Link>
      <Link href="/descubrir" aria-label={labels.discover} aria-current={active === "discover" ? "page" : undefined} className={slot(active === "discover")}>
        <IconSearch size={26} stroke="#EFE6D8" weight={1.9} />
      </Link>
      <Link href="/ganar" aria-label={labels.earn} aria-current={active === "earn" ? "page" : undefined} className={slot(active === "earn")}>
        <IconDollar size={26} stroke="#EFE6D8" />
      </Link>
    </nav>
  );
}
