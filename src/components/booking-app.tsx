"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { miamiDate, SERVICE_TYPES, type Availability, type Booking, type ServiceType, type Slot } from "@/lib/booking";
import type { Locale } from "@/lib/locale";

export type BookLabels = {
  live: string;
  demo: string;
  demoNote: string;
  today: string;
  all: string;
  types: Record<ServiceType, string>;
  units: Record<string, string>;
  taken: string;
  pick: string;
  guests: string;
  notes: string;
  confirm: string;
  booking: string;
  signIn: string;
  signInHint: string;
  booked: string;
  demoBooked: string;
  slotTaken: string;
  error: string;
  mine: string;
  none: string;
  cancel: string;
  status: Record<string, string>;
  loading: string;
};

const hm = (t: string) => t.slice(0, 5);

export function BookingApp({ labels: l, locale, signedIn }: { labels: BookLabels; locale: Locale; signedIn: boolean }) {
  const days = Array.from({ length: 7 }, (_, i) => miamiDate(i));
  const [date, setDate] = useState(days[0]);
  const [type, setType] = useState<ServiceType | "all">("all");
  const [data, setData] = useState<Availability | null>(null);
  const [pick, setPick] = useState<Slot | null>(null);
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mine, setMine] = useState<Booking[]>([]);

  const load = useCallback(async (d: string) => {
    const r = await fetch(`/api/availability?date=${d}`, { cache: "no-store" });
    setData(await r.json());
  }, []);
  const loadMine = useCallback(async () => {
    if (!signedIn) return;
    const r = await fetch("/api/bookings", { cache: "no-store" });
    if (r.ok) setMine((await r.json()).bookings ?? []);
  }, [signedIn]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on date change
    load(date);
  }, [date, load]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadMine();
  }, [loadMine]);

  const fmtDay = (d: string, i: number) =>
    i === 0 ? l.today : new Date(`${d}T12:00:00`).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { weekday: "short", day: "numeric" });

  async function book() {
    if (!pick || !data) return;
    setMsg(null);
    if (data.source === "demo") {
      setData({ ...data, slots: data.slots.map((s) => (s.id === pick.id ? { ...s, available: false } : s)) });
      setPick(null);
      return setMsg({ ok: true, text: l.demoBooked });
    }
    setBusy(true);
    const r = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slotId: pick.id, guests, notes }) });
    setBusy(false);
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMsg({ ok: true, text: l.booked });
      setPick(null);
      setNotes("");
    } else setMsg({ ok: false, text: j.error === "slot_taken" ? l.slotTaken : j.error === "auth_required" ? l.signInHint : l.error });
    load(date);
    loadMine();
  }

  async function cancel(id: string) {
    const r = await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    if (!r.ok) setMsg({ ok: false, text: l.error });
    load(date);
    loadMine();
  }

  const services = (data?.services ?? []).filter((s) => type === "all" || s.type === type);
  const live = data?.source === "live";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {days.map((d, i) => (
            <button key={d} type="button" aria-pressed={d === date} onClick={() => { setDate(d); setPick(null); }} className={`h-9 shrink-0 rounded-full border px-3 text-[12px] font-bold capitalize ${d === date ? "border-gold/50 bg-gold/15 text-white" : "border-white/10 text-mute"}`}>
              {fmtDay(d, i)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {(["all", ...SERVICE_TYPES] as const).map((k) => (
          <button key={k} type="button" aria-pressed={k === type} onClick={() => setType(k)} className={`rounded-full border px-3 py-1.5 text-[12px] font-bold ${k === type ? "border-white/25 bg-white/[0.1] text-white" : "border-white/10 text-mute"}`}>
            {k === "all" ? l.all : l.types[k]}
          </button>
        ))}
        {data && (
          <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${live ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-mute"}`}>{live ? l.live : l.demo}</span>
        )}
      </div>
      {data && !live && <p className="text-[11px] text-mute">{l.demoNote}</p>}

      {msg && <p role="status" className={`rounded-2xl px-4 py-3 text-[13px] font-bold ${msg.ok ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{msg.text}</p>}

      {!data ? (
        <p className="text-[13px] text-mute">{l.loading}</p>
      ) : (
        services.map((s) => (
          <section key={s.id} className="rounded-[22px] border border-white/[0.08] bg-card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[15px] font-bold text-white">{s.provider_name}</p>
              <p className="text-[14px] font-extrabold text-gold-soft">${Number(s.price).toLocaleString("en-US")} <span className="text-[11px] font-bold text-mute">/ {l.units[s.price_unit] ?? s.price_unit}</span></p>
            </div>
            <p className="text-[12px] text-mute">{l.types[s.type]} · ★ {s.rating ?? "–"} · {s.description}</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {data.slots.filter((x) => x.service_id === s.id).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  disabled={!x.available}
                  aria-pressed={pick?.id === x.id}
                  onClick={() => { setPick(x); setMsg(null); }}
                  className={`h-9 rounded-xl border text-[12px] font-bold ${!x.available ? "border-white/5 text-white/25 line-through" : pick?.id === x.id ? "border-gold bg-gold text-ink" : "border-white/10 text-cream"}`}
                  title={x.available ? undefined : l.taken}
                >
                  {hm(x.start_time)}
                </button>
              ))}
            </div>
            {pick && pick.service_id === s.id && (
              <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-gold/25 bg-gold/[0.05] p-3">
                <p className="text-[13px] text-cream">{l.pick} <b className="text-white">{hm(pick.start_time)}–{hm(pick.end_time)}</b></p>
                <div className="flex gap-2">
                  <label className="flex w-24 flex-col gap-1 text-[11px] text-mute">
                    {l.guests}
                    <input type="number" min={1} max={50} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-10 rounded-xl border border-white/10 bg-ink/60 px-3 text-[14px] text-white" />
                  </label>
                  <label className="flex grow flex-col gap-1 text-[11px] text-mute">
                    {l.notes}
                    <input maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-ink/60 px-3 text-[14px] text-white" />
                  </label>
                </div>
                {live && !signedIn ? (
                  <Link href="/entrar?next=/reservar" className="flex h-11 items-center justify-center rounded-full bg-cream text-[14px] font-bold text-ink">{l.signIn}</Link>
                ) : (
                  <button type="button" disabled={busy} onClick={book} className="h-11 rounded-full bg-cream text-[14px] font-bold text-ink disabled:opacity-60">{busy ? l.booking : l.confirm}</button>
                )}
              </div>
            )}
          </section>
        ))
      )}

      {signedIn && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-bold text-white">{l.mine}</h2>
          {mine.length === 0 && <p className="text-[13px] text-mute">{l.none}</p>}
          {mine.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-[20px] border border-white/[0.08] bg-card p-3">
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-white">{b.catalog_services?.provider_name}</span>
                <span className="block text-[12px] text-mute">
                  {b.availability_slots?.date} · {b.availability_slots && hm(b.availability_slots.start_time)} · {b.guests} · {l.status[b.status]}
                </span>
              </span>
              {(b.status === "confirmed" || b.status === "requested") && (
                <button type="button" onClick={() => cancel(b.id)} className="h-9 shrink-0 rounded-full border border-white/15 px-3 text-[12px] font-bold text-cream">{l.cancel}</button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
