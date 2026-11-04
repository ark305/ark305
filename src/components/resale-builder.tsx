"use client";

import Link from "next/link";
import { useState } from "react";
import { catalog, defaultEntry, entryPrice } from "@/lib/catalog";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { clientPrice, proposals, RESALE_FEE, resellerProfit, type ResaleItem } from "@/lib/resale-store";
import { IconCheck, IconLock } from "./icons";
import { Photo } from "./photo";
import { useToast } from "./toast";

// Business · Ofrecer: arma un paquete con servicios de ARK, ponle tu margen y mándalo con tu marca.
export function ResaleBuilder({ locale, canSell, brandName }: { locale: Locale; canSell: boolean; brandName: string }) {
  const t = dict(locale);
  const r = t.biz.resell;
  const money = (n: number) => formatPrice(n, locale);
  const { show } = useToast();
  const [picked, setPicked] = useState<string[]>([]);
  const [guests, setGuests] = useState(8);
  const [margin, setMargin] = useState(25);
  const [client, setClient] = useState("");
  const [brand, setBrand] = useState(brandName);
  const [whiteLabel, setWhiteLabel] = useState(true);
  const [sentId, setSentId] = useState<string | null>(null);

  const items: ResaleItem[] = picked.map((id) => {
    const e = defaultEntry(id, guests);
    return { id, qty: e.qty, guests };
  });
  const wholesale = items.reduce((s, i) => s + entryPrice({ ...i, uid: "", time: "12:00" }), 0);
  const deal = { wholesale, margin };

  function send() {
    if (!picked.length) return show(r.needItems);
    if (!client.trim()) return show(r.needClient);
    setSentId(proposals.add({ client: client.trim(), brand: brand.trim() || brandName, whiteLabel, items, wholesale, margin }));
    show(r.sent);
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8">
      <header>
        <span className="mb-2 inline-flex rounded-full bg-gold/15 px-3 py-1 text-[12px] font-bold text-gold">Business</span>
        <h1 className="font-display text-[38px] leading-[1.05] font-semibold text-white">{r.title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-mute">{r.sub}</p>
      </header>

      {/* 1 · Servicios */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white">{r.step1}</h2>
          <span className="flex items-center gap-2 text-sm text-cream/80">
            {t.day.people}
            <button type="button" aria-label="−" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="size-7 rounded-full bg-white/10">
              −
            </button>
            <span className="w-5 text-center font-bold tabular-nums">{guests}</span>
            <button type="button" aria-label="+" onClick={() => setGuests((g) => Math.min(40, g + 1))} className="size-7 rounded-full bg-white/10">
              +
            </button>
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {catalog.map((c) => {
            const on = picked.includes(c.id);
            const price = entryPrice({ ...defaultEntry(c.id, guests), uid: "" });
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                  className={`flex w-full items-center gap-3 rounded-[18px] border p-2 text-left ${on ? "border-gold/60 bg-gold/[0.07]" : "border-white/10"}`}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-[12px]">
                    <Photo src={c.photo} name={c.name[locale]} sizes="44px" />
                  </span>
                  <span className="flex min-w-0 grow flex-col">
                    <span className="truncate text-[14px] font-bold text-white">{c.name[locale]}</span>
                    <span className="truncate text-[12px] text-mute">{c.desc[locale]}</span>
                  </span>
                  <span className="text-[13px] font-semibold text-cream tabular-nums">{money(price)}</span>
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${on ? "bg-gold" : "border border-white/20"}`}>
                    {on && <IconCheck size={13} stroke="#08090B" weight={2.8} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 2 · Margen */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white">{r.step2}</h2>
          <span className="text-2xl font-extrabold text-gold tabular-nums">{margin}%</span>
        </div>
        <input type="range" min={0} max={50} step={5} value={margin} onChange={(e) => setMargin(Number(e.target.value))} aria-label={r.step2} className="accent-[var(--accent)]" />
      </section>

      {/* 3 · Cliente y marca */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-white">{r.step3}</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-mute">{r.client}</span>
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder={r.clientPh} maxLength={60} className="h-12 rounded-full border border-white/10 bg-white/[0.05] px-4 text-base text-cream outline-none focus:border-gold/60" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-mute">{r.brand}</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={60} className="h-12 rounded-full border border-white/10 bg-white/[0.05] px-4 text-base text-cream outline-none focus:border-gold/60" />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 px-4 py-3">
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold text-cream">{r.whiteLabel}</span>
            <span className="text-[12px] text-mute">{r.whiteLabelNote}</span>
          </span>
          <input type="checkbox" checked={whiteLabel} onChange={(e) => setWhiteLabel(e.target.checked)} className="size-5 accent-[var(--accent)]" />
        </label>
      </section>

      {/* Lo que ve tu cliente */}
      <section className="flex flex-col gap-2">
        <p className="text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{r.preview}</p>
        <div className="rounded-[22px] bg-cream p-4 text-ink">
          <p className="text-lg font-extrabold">{brand || brandName}</p>
          <p className="text-[13px] text-ink/70">{r.proposalFor(client || "—")}</p>
          <ul className="mt-3 flex flex-col gap-1 border-t border-ink/10 pt-3 text-sm">
            {items.map((i) => (
              <li key={i.id}>• {catalog.find((c) => c.id === i.id)!.name[locale]}</li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-ink/10 pt-3 text-base font-extrabold">
            <span>{t.day.total}</span>
            <span className="tabular-nums">{money(clientPrice(deal))}</span>
          </p>
          {!whiteLabel && <p className="mt-2 text-[11px] text-ink/60">{r.coBrand}</p>}
        </div>
      </section>

      {/* Tus números */}
      <section className="flex flex-col gap-1.5 rounded-[22px] border border-white/10 bg-white/[0.035] p-4 text-sm">
        <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-mute uppercase">{r.breakdown}</p>
        <Row label={r.cost} value={money(wholesale)} />
        <Row label={r.fee} value={`−${money(Math.round(wholesale * RESALE_FEE))}`} />
        <Row label={r.profit} value={money(resellerProfit(deal))} strong />
        <Row label={r.clientPays} value={money(clientPrice(deal))} />
      </section>

      {canSell ? (
        sentId ? (
          <Link href="/documentos" className="gold-grad flex h-[52px] items-center justify-center rounded-full text-base font-bold text-ink">
            {r.docs}
          </Link>
        ) : (
          <button type="button" onClick={send} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink">
            {r.send}
          </button>
        )
      ) : (
        <Link href="/niveles" className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-gold text-base font-bold text-ink">
          <IconLock size={16} stroke="#08090B" weight={2} /> {r.locked}
        </Link>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-bold text-gold" : "text-mute"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
