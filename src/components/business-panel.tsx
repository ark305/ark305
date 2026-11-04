"use client";

import Link from "next/link";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { clientPrice, resellerProfit, useProposals } from "@/lib/resale-store";
import { IconChevron } from "./icons";

// Panel en Business · Ofrecer: propuestas a tus clientes y lo que ganas revendiendo.
export function BusinessPanel({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const b = t.biz.panel;
  const money = (n: number) => formatPrice(n, locale);
  const list = useProposals();
  const accepted = list.filter((p) => p.status !== "sent");
  const margin = accepted.reduce((s, p) => s + resellerProfit(p), 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: b.stats.proposals, value: String(list.length) },
          { label: b.stats.accepted, value: String(accepted.length) },
          { label: b.stats.margin, value: money(margin) },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-[20px] border border-white/10 bg-white/[0.035] p-3">
            <span className="text-[20px] font-extrabold text-white tabular-nums">{s.value}</span>
            <span className="text-[11px] leading-tight text-mute">{s.label}</span>
          </div>
        ))}
      </div>
      <h2 className="mt-2 text-lg font-extrabold text-white">{b.recent}</h2>
      {list.length === 0 ? (
        <Link href="/revender" className="rounded-[20px] border border-dashed border-white/15 px-5 py-6 text-center text-sm text-mute">
          {b.none}
        </Link>
      ) : (
        list.slice(0, 4).map((p) => (
          <Link key={p.id} href="/documentos" className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.035] p-3">
            <span className="flex min-w-0 grow flex-col">
              <span className="truncate text-[15px] font-bold text-white">{p.client}</span>
              <span className="text-[12px] text-mute">
                {p.id} · {t.biz.docs.status[p.status]}
              </span>
            </span>
            <span className="text-sm font-bold text-cream tabular-nums">{money(clientPrice(p))}</span>
            <IconChevron size={16} stroke="#9A9EA6" />
          </Link>
        ))
      )}
    </section>
  );
}
