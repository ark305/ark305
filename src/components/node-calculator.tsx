"use client";

import { useState } from "react";
import { RESIDENT_MONTHS, RESIDENT_PRICE, SERVICE_SPEND, SERVICE_TAKE, VIP_UPTAKE, VIP_YEAR } from "@/lib/developers";
import type { Locale } from "@/lib/locale";

const usd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M` : `$${Math.round(n / 1000).toLocaleString("en-US")}K`;

type Labels = {
  units: string;
  avgPrice: string;
  devCost: string;
  ofSales: string;
  nodes: string;
  arkYear: string;
  note: string;
};

// Calculadora por proyecto: cuánto cuesta la Membresía Residente al developer y qué genera la red.
export function NodeCalculator({ labels, locale }: { labels: Labels; locale: Locale }) {
  const [units, setUnits] = useState(400);
  const [avg, setAvg] = useState(1.5);
  const sales = units * avg * 1_000_000;
  const devCost = units * RESIDENT_PRICE * RESIDENT_MONTHS;
  const arkYear = units * RESIDENT_PRICE * 12 + units * SERVICE_SPEND * SERVICE_TAKE + Math.round(units * VIP_UPTAKE) * VIP_YEAR;
  const pct = ((devCost / sales) * 100).toLocaleString(locale === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-gold/25 bg-card p-4">
      <Slider label={labels.units} value={String(units)} min={50} max={800} step={10} n={units} onChange={setUnits} />
      <Slider label={labels.avgPrice} value={`$${avg.toLocaleString("en-US")}M`} min={0.5} max={10} step={0.5} n={avg} onChange={setAvg} />
      <div className="grid grid-cols-2 gap-2">
        <Out label={labels.devCost} value={usd(devCost)} sub={labels.ofSales.replace("{pct}", pct)} />
        <Out label={labels.nodes} value={units.toLocaleString("en-US")} />
        <Out label={labels.arkYear} value={usd(arkYear)} gold wide />
      </div>
      <p className="text-[11px] leading-snug text-mute">{labels.note}</p>
    </div>
  );
}

function Slider({ label, value, n, min, max, step, onChange }: { label: string; value: string; n: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between text-[13px] text-cream/80">
        {label} <span className="text-[15px] font-bold text-white">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={n} onChange={(e) => onChange(Number(e.target.value))} className="accent-[#D8B170]" />
    </label>
  );
}

function Out({ label, value, sub, gold, wide }: { label: string; value: string; sub?: string; gold?: boolean; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${wide ? "col-span-2" : ""} ${gold ? "border-gold/25 bg-gold/[0.06]" : "border-white/[0.08] bg-raised"}`}>
      <p className={`text-[10px] font-bold tracking-[0.12em] uppercase ${gold ? "text-gold-soft" : "text-mute"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-mute">{sub}</p>}
    </div>
  );
}
