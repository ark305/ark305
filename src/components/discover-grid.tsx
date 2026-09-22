"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category } from "@/lib/mock-data";
import { IconChevron, IconMegaphone, IconSearch } from "./icons";
import { SoonButton } from "./toast";

export type DiscoverItem = { handle: string; name: string; role: string; area: string; category: Category; near: boolean; tone: string };
type Chip = "forYou" | "near" | "yachts" | "food" | "content";

type Text = {
  searchLabel: string;
  searchPlaceholder: string;
  promoteTitle: string;
  promoteSub: string;
  chips: Record<Chip, string>;
  empty: string;
  photo: string;
};

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function DiscoverGrid({ items, text }: { items: DiscoverItem[]; text: Text }) {
  const [chip, setChip] = useState<Chip>("forYou");
  const [query, setQuery] = useState("");

  const q = normalize(query.trim().replace(/^[#@]/, ""));
  const shown = items.filter((p) => {
    if (chip === "near" && !p.near) return false;
    if ((chip === "yachts" || chip === "food" || chip === "content") && p.category !== chip) return false;
    if (!q) return true;
    return [p.name, p.handle, p.role, p.area].some((f) => normalize(f).includes(q));
  });

  return (
    <div>
      <div className="flex flex-col gap-3.5 px-3.5 pt-[22px]">
        <label className="flex h-[54px] items-center gap-3 rounded-full border border-line bg-card px-[18px]">
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
        <SoonButton className="flex h-[76px] items-center gap-3.5 rounded-[22px] bg-gold px-[18px] text-left text-ink">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink/12">
            <IconMegaphone size={22} stroke="#08090B" weight={1.9} />
          </span>
          <span className="flex grow flex-col">
            <span className="text-[17px] font-extrabold">{text.promoteTitle}</span>
            <span className="text-[13px]">{text.promoteSub}</span>
          </span>
          <IconChevron size={20} stroke="#08090B" weight={2} />
        </SoonButton>
        <div className="no-scrollbar -mx-3.5 flex gap-2 overflow-x-auto px-3.5">
          {(Object.keys(text.chips) as Chip[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={chip === c}
              onClick={() => setChip(c)}
              className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold ${chip === c ? "bg-cream text-ink" : "border border-line text-cream"}`}
            >
              {text.chips[c]}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="px-6 pt-10 text-center text-[15px] text-mute">{text.empty}</p>
      ) : (
        <div className="mt-3.5 grid grid-cols-3 gap-[3px]">
          {shown.map((p) => (
            <Link key={p.handle} href={`/@${p.handle}`} className="relative flex h-[168px] flex-col justify-end p-2.5 text-white" style={{ background: p.tone }}>
              <span className="absolute inset-x-0 top-16 text-center text-[9px] tracking-[0.12em] text-[#5e6269]">[{text.photo}]</span>
              <span className="text-[13px] font-bold">{p.name}</span>
              <span className="text-[11px] text-mute">{p.role}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
