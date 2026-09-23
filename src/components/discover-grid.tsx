"use client";

import { Photo } from "./photo";
import Link from "next/link";
import { useState } from "react";
import type { Kind } from "@/lib/mock-data";
import { IconChevron, IconCrown, IconLock, IconMegaphone, IconPeople, IconSearch } from "./icons";
import { SoonButton, useToast } from "./toast";

export type DiscoverItem = { handle: string; name: string; role: string; area: string; kind: Kind; kindLabel: string; near: boolean; private: boolean; photo: string | null };
type Chip = "forYou" | "near" | "provider" | "creator" | "remote" | "brand" | "private";

type Text = {
  searchLabel: string;
  searchPlaceholder: string;
  promoteTitle: string;
  promoteSub: string;
  chips: Record<Chip, string>;
  empty: string;
  privateLocked: string;
  talentTitle: string;
  talentSub: string;
};

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function DiscoverGrid({ items, text, vip }: { items: DiscoverItem[]; text: Text; vip: boolean }) {
  const { show } = useToast();
  const [chip, setChip] = useState<Chip>("forYou");
  const [query, setQuery] = useState("");

  const q = normalize(query.trim().replace(/^[#@]/, ""));
  const shown = items.filter((p) => {
    // Los perfiles de ARK Private solo aparecen en su pestaña, y solo para VIP.
    if (p.private !== (chip === "private")) return false;
    if (chip === "near" && !p.near) return false;
    if (chip !== "forYou" && chip !== "near" && chip !== "private" && p.kind !== chip) return false;
    if (!q) return true;
    return [p.name, p.handle, p.role, p.area].some((f) => normalize(f).includes(q));
  });

  return (
    <div>
      <div className="flex flex-col gap-3.5 px-3.5 pt-[22px]">
        <label className="glass flex h-[54px] items-center gap-3 rounded-full px-[18px]">
          <IconSearch size={22} stroke="#EFE6D8" weight={2} />
          <input
            type="search"
            aria-label={text.searchLabel}
            placeholder={text.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 grow bg-transparent text-[15px] text-cream outline-none placeholder:text-mute"
          />
        </label>
        <SoonButton className="gold-grad flex h-[76px] items-center gap-3.5 rounded-[22px] px-[18px] text-left text-ink shadow-[0_14px_40px_-16px_#d8b170cc]">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/30">
            <IconMegaphone size={22} stroke="#08090B" weight={1.9} />
          </span>
          <span className="flex grow flex-col">
            <span className="text-[17px] font-extrabold">{text.promoteTitle}</span>
            <span className="text-[13px]">{text.promoteSub}</span>
          </span>
          <IconChevron size={20} stroke="#08090B" weight={2} />
        </SoonButton>
        <Link href="/talento" className="flex h-[68px] items-center gap-3.5 rounded-[22px] border border-[#8FB0D0]/35 bg-[#8FB0D0]/[0.08] px-[18px]">
          <span className="gloss flex size-10 shrink-0 items-center justify-center rounded-[13px]" style={{ "--c": "#8FB0D0" } as React.CSSProperties}>
            <IconPeople size={20} stroke="#FFFFFF" weight={2} />
          </span>
          <span className="flex grow flex-col">
            <span className="text-[16px] font-extrabold text-white">{text.talentTitle}</span>
            <span className="text-[13px] text-cream/70">{text.talentSub}</span>
          </span>
          <IconChevron size={20} stroke="#8FB0D0" weight={2} />
        </Link>
        <div className="no-scrollbar -mx-3.5 flex gap-2 overflow-x-auto px-3.5">
          {(Object.keys(text.chips) as Chip[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={chip === c}
              onClick={() => (c === "private" && !vip ? show(text.privateLocked) : setChip(c))}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                chip === c ? (c === "private" ? "gold-grad text-ink" : "bg-cream text-ink") : c === "private" ? "border border-gold/40 text-gold-soft" : "border border-white/10 bg-white/[0.04] text-cream"
              }`}
            >
              {c === "private" && (vip ? <IconCrown size={13} stroke={chip === c ? "#08090B" : "#EBD3A0"} weight={2} /> : <IconLock size={13} stroke="#EBD3A0" weight={2} />)}
              {text.chips[c]}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="px-6 pt-10 text-center text-[15px] text-mute">{text.empty}</p>
      ) : (
        <div className="mt-3.5 grid grid-cols-3 gap-[3px]">
          {shown.map((p, i) => (
            <Link key={p.handle} href={`/@${p.handle}`} className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden bg-raised p-2.5 text-white">
              <Photo src={p.photo} name={p.name} sizes="(max-width: 430px) 33vw, 143px" priority={i < 6} className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="glass absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide text-cream/90">{p.kindLabel}</span>
              <span className="relative text-[13px] font-bold">{p.name}</span>
              <span className="relative text-[11px] text-cream/70">{p.role}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
