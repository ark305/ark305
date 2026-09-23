"use client";

import Link from "next/link";
import { useState } from "react";
import { catalog } from "@/lib/catalog";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { clientPrice, docFlags, proposals, resellerProfit, useDocFlags, useProposals } from "@/lib/resale-store";
import { monthly, positions } from "@/lib/talent";
import { useTeam, type Hire } from "@/lib/team-store";
import { IconCheck } from "./icons";

type Tab = "quotes" | "contracts" | "invoices" | "reports";

const hireCost = (h: Hire) => {
  const p = positions.find((x) => x.id === h.id);
  if (!p) return 0;
  return p.unit === "h" ? monthly(p.rate * h.mult, h.hours) : Math.round(p.rate * h.mult);
};

function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-white/[0.035] p-4">{children}</div>;
}

function Head({ title, right }: { title: string; right: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-[15px] font-bold text-white">{title}</p>
      {right}
    </div>
  );
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${ok ? "bg-teal/15 text-teal" : "bg-gold/15 text-gold"}`}>{children}</span>;
}

// Business: todo el papeleo en un lugar. Se arma solo con tu equipo y tus paquetes.
export function DocsView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const d = t.biz.docs;
  const money = (n: number) => formatPrice(n, locale);
  const [tab, setTab] = useState<Tab>("quotes");
  const hires = useTeam();
  const props = useProposals();
  const flags = useDocFlags();

  const teamSubtotal = hires.reduce((s, h) => s + hireCost(h), 0);
  const teamFee = Math.round(teamSubtotal * 0.05);
  const empty = hires.length === 0 && props.length === 0;

  return (
    <div className="flex flex-col gap-4 px-4 pt-8">
      <header>
        <span className="mb-2 inline-flex rounded-full bg-gold/15 px-3 py-1 text-[12px] font-bold text-gold">Business</span>
        <h1 className="font-display text-[38px] leading-[1.05] font-semibold text-white">{d.title}</h1>
        <p className="mt-2 text-[15px] text-mute">{d.sub}</p>
      </header>

      <div role="tablist" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {(Object.keys(d.tabs) as Tab[]).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${tab === k ? "bg-cream text-ink" : "border border-white/10 bg-white/[0.04] text-cream"}`}
          >
            {d.tabs[k]}
          </button>
        ))}
      </div>

      {empty && tab !== "reports" && (
        <p className="rounded-[20px] border border-dashed border-white/15 px-5 py-8 text-center text-[15px] text-mute">
          {d.empty}{" "}
          <Link href="/equipo" className="font-semibold text-gold">
            {t.nav.team}
          </Link>{" "}
          ·{" "}
          <Link href="/revender" className="font-semibold text-gold">
            {t.nav.resell}
          </Link>
        </p>
      )}

      {tab === "quotes" && (
        <>
          {hires.length > 0 && (
            <Card>
              <Head title={d.teamQuote} right={<span className="text-[15px] font-bold text-white tabular-nums">{money(teamSubtotal + teamFee)}</span>} />
              {hires.map((h) => (
                <div key={h.uid} className="flex justify-between text-[13px] text-cream/85">
                  <span>
                    {positions.find((p) => p.id === h.id)?.name[locale]} · {h.candidate}
                  </span>
                  <span className="tabular-nums">{money(hireCost(h))}</span>
                </div>
              ))}
              <div className="flex justify-between text-[13px] text-mute">
                <span>{t.talent.fee}</span>
                <span className="tabular-nums">{money(teamFee)}</span>
              </div>
            </Card>
          )}
          {props.map((p) => (
            <Card key={p.id}>
              <Head title={`${p.id} · ${p.client}`} right={<Pill ok={p.status !== "sent"}>{d.status[p.status]}</Pill>} />
              <p className="text-[13px] text-mute">{p.items.map((i) => catalog.find((c) => c.id === i.id)?.name[locale]).join(" · ")}</p>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-white tabular-nums">{money(clientPrice(p))}</span>
                {p.status !== "paid" && (
                  <button type="button" onClick={() => proposals.advance(p.id)} className="rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-cream">
                    {d.advance[p.status]}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </>
      )}

      {tab === "contracts" && (
        <>
          {hires.length > 0 && (
            <Card>
              <Head title={d.teamContract} right={<Pill ok={flags.includes("team-signed")}>{flags.includes("team-signed") ? d.signed : d.ready}</Pill>} />
              <ul className="flex flex-col gap-1 text-[13px] text-cream/85">
                {d.contractTerms.map((c) => (
                  <li key={c} className="flex gap-2">
                    <IconCheck size={14} weight={2.4} className="mt-0.5 shrink-0 text-gold" /> {c}
                  </li>
                ))}
              </ul>
              {!flags.includes("team-signed") && (
                <button type="button" onClick={() => docFlags.toggle("team-signed")} className="gold-grad mt-1 h-11 rounded-full text-sm font-bold text-ink">
                  {d.sign}
                </button>
              )}
            </Card>
          )}
          {props
            .filter((p) => p.status !== "sent")
            .map((p) => (
              <Card key={p.id}>
                <Head title={d.resaleContract(p.client)} right={<Pill ok>{d.signed}</Pill>} />
                <p className="text-[13px] text-mute">
                  {p.id} · {money(clientPrice(p))}
                </p>
              </Card>
            ))}
        </>
      )}

      {tab === "invoices" && (
        <>
          {hires.length > 0 && (
            <Card>
              <Head title={d.invoice("ARK-INV-0001")} right={<Pill ok={flags.includes("inv-team")}>{flags.includes("inv-team") ? d.paid : d.due}</Pill>} />
              <div className="flex justify-between text-[13px] text-cream/85">
                <span>{d.teamQuote}</span>
                <span className="tabular-nums">{money(teamSubtotal + teamFee)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-mute">
                <span>{d.payFee}</span>
                <span className="tabular-nums">{money(Math.round((teamSubtotal + teamFee) * 0.01))}</span>
              </div>
              {!flags.includes("inv-team") && (
                <button type="button" onClick={() => docFlags.toggle("inv-team")} className="mt-1 h-11 rounded-full border border-white/15 text-sm font-semibold text-cream">
                  {d.markPaid}
                </button>
              )}
            </Card>
          )}
          {props
            .filter((p) => p.status !== "sent")
            .map((p) => (
              <Card key={p.id}>
                <Head title={`${d.invoice(p.id.replace("P", "INV"))} · ${p.brand}`} right={<Pill ok={p.status === "paid"}>{p.status === "paid" ? d.paid : d.due}</Pill>} />
                <div className="flex justify-between text-[13px] text-cream/85">
                  <span>{p.client}</span>
                  <span className="tabular-nums">{money(clientPrice(p))}</span>
                </div>
              </Card>
            ))}
        </>
      )}

      {tab === "reports" && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: d.reportHours, value: String(hires.reduce((s, h) => s + h.hours, 0)) },
            { label: d.reportSpend, value: money(teamSubtotal + teamFee) },
            { label: d.reportProposals, value: String(props.length) },
            { label: d.reportMargin, value: money(props.filter((p) => p.status === "paid").reduce((s, p) => s + resellerProfit(p), 0)) },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-[20px] border border-white/10 bg-white/[0.035] p-3.5">
              <span className="text-2xl font-extrabold text-white tabular-nums">{s.value}</span>
              <span className="text-[12px] leading-tight text-mute">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-mute">{d.demo}</p>
    </div>
  );
}
