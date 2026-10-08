"use client";

import Image from "next/image";
import { useState } from "react";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { residenceDetails, shortUSD, type Residence } from "@/lib/private";
import { Sheet } from "./sheet";
import { useToast } from "./toast";

// Residencias de ARK Private: tarjetas y ficha con amenidades, HOA y plan de pagos.
export function ResidenceCards({ residences, locale }: { residences: Residence[]; locale: Locale }) {
  const p = dict(locale).private;
  const { show } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = residences.find((r) => r.id === openId) ?? null;
  const d = open ? residenceDetails[open.id] : null;

  const act = (msg: string) => {
    setOpenId(null);
    show(msg);
  };

  return (
    <>
      <div className="no-scrollbar flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5">
        {residences.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setOpenId(r.id)}
            className="relative flex h-[300px] w-[78%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[26px] border border-gold/25 p-4 text-left"
          >
            <Image src={r.photo} alt="" fill sizes="340px" className="object-cover" />
            <div className="fade-bottom absolute inset-0" />
            <span className="relative text-[12px] font-semibold text-gold-soft">
              {r.hood} · {p.delivery(r.delivery)}
            </span>
            <span className="relative font-display text-2xl font-semibold text-white">{r.name}</span>
            <span className="relative text-[13px] text-cream/75">
              {r.developer} · {r.beds[locale]}
            </span>
            <span className="relative mt-1 text-base font-bold text-gold-soft">
              {p.from} {r.from}
            </span>
          </button>
        ))}
      </div>

      {open && d && (
        <Sheet label={open.name} closeLabel={p.close} onClose={() => setOpenId(null)}>
          <div className="relative -mx-5 -mt-5 aspect-[16/9] overflow-hidden rounded-t-[28px]">
            <Image src={open.photo} alt="" fill sizes="430px" className="object-cover" />
            <span className="gold-grad absolute bottom-3 left-4 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink">{p.delivery(open.delivery)}</span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-white">{open.name}</h2>
          <p className="text-sm text-mute">
            {open.hood} · {open.beds[locale]} · {d.size}
          </p>
          <div className="rounded-[18px] border border-gold/25 bg-gold/[0.06] p-3.5">
            <p className="text-[12px] text-mute">{p.from}</p>
            <p className="text-2xl font-extrabold text-gold-soft">{shortUSD(d.price)}</p>
            <p className="text-[13px] text-cream/75">{d.hoa ? p.hoa(`$${d.hoa.toFixed(2)}`) : p.noHoa}</p>
          </div>

          <p className="text-[11px] font-bold tracking-[0.14em] text-gold-soft uppercase">{p.amenities}</p>
          <div className="flex flex-wrap gap-1.5">
            {d.amenities.map((a) => (
              <span key={a.es} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] text-cream">
                {a[locale]}
              </span>
            ))}
          </div>

          <p className="text-[11px] font-bold tracking-[0.14em] text-gold-soft uppercase">{p.payPlan}</p>
          <ul className="flex flex-col rounded-[18px] border border-line bg-raised/40 px-3.5">
            {d.plan.map((x, i) => (
              <li key={i} className="flex justify-between border-b border-white/[0.06] py-2.5 text-sm text-cream last:border-0">
                <span>{x.stage[locale]}</span>
                <span className="text-mute">{x.pct}%</span>
                <span className="w-16 text-right font-semibold tabular-nums">{shortUSD((d.price * x.pct) / 100)}</span>
              </li>
            ))}
          </ul>

          <p className="text-sm text-mute">
            {p.developer}: <span className="font-semibold text-cream">{open.developer}</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => act(p.dossierDone)} className="h-12 rounded-full border border-white/15 text-[14px] font-semibold text-cream">
              {p.dossier}
            </button>
            <button type="button" onClick={() => act(p.visitDone)} className="gold-grad h-12 rounded-full px-2 text-[14px] font-bold text-ink">
              {p.visit}
            </button>
          </div>
          <button type="button" onClick={() => act(p.reserveDone)} className="h-12 rounded-full border border-gold/40 text-[15px] font-semibold text-gold-soft">
            {p.reserve}
          </button>
          <p className="text-[12px] leading-normal text-mute">{p.detailNote}</p>
        </Sheet>
      )}
    </>
  );
}
