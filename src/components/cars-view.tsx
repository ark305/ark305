"use client";

import { useState } from "react";
import { carAllowed, carCats, carDays, cars, getCar, getTier, tiers, type Car, type CarCat } from "@/lib/cars";
import { carStore, useCars } from "@/lib/cars-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { CarArt } from "./car-art";
import { IconCar, IconCheck, IconChevron, IconCrown } from "./icons";
import { Sheet } from "./sheet";
import { useToast } from "./toast";

// Fecha local "AAAA-MM-DD" (hoy + n días).
const isoDay = (plus = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + plus);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ARK CARS: membresía con créditos mensuales, flota y reservas con entrega a domicilio.
export function CarsView({ locale }: { locale: Locale }) {
  const t = dict(locale).cars;
  const { show } = useToast();
  const state = useCars();
  const tier = getTier(state.tier);
  const left = tier ? Math.max(0, tier.credits - state.used) : 0;
  const money = (n: number) => formatPrice(n, locale);
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00`));

  const [filter, setFilter] = useState<CarCat | "all">("all");
  const [plans, setPlans] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const closePlans = () => setPlans(false);
  const closeCar = () => setOpenId(null);

  const shown = cars.filter((c) => filter === "all" || c.cat === filter);
  const upcoming = state.bookings.filter((b) => b.to >= isoDay()).sort((a, b) => a.from.localeCompare(b.from));
  const open = openId ? getCar(openId) : null;

  return (
    <div className="flex flex-col gap-7 px-4 pt-8">
      <header>
        <h1 className="font-display text-[40px] leading-[1.02] font-semibold text-white">{t.title}</h1>
        <p className="mt-3 text-base leading-normal text-mute">{t.sub}</p>
      </header>

      {/* Membresía */}
      {tier ? (
        <section className="flex flex-col gap-3 rounded-[26px] border border-gold/35 bg-gold/[0.07] p-4">
          <div className="flex items-center gap-3">
            <span className="gold-grad flex size-10 items-center justify-center rounded-[13px]">
              <IconCar size={20} stroke="#08090B" weight={2} />
            </span>
            <span className="grow text-lg font-extrabold text-white">{tier.name}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-bold text-gold-soft">
              {money(tier.price)}
              {t.perMonth}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="gold-grad h-full rounded-full" style={{ width: `${Math.min(100, (state.used / tier.credits) * 100)}%` }} />
          </div>
          <p className="text-sm text-cream/80">{t.creditsLeft(left, tier.credits)}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPlans(true)} className="h-10 grow rounded-full border border-white/15 text-sm font-semibold text-cream">
              {t.change}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(t.cancelAsk)) return;
                carStore.cancel();
                show(t.canceled);
              }}
              className="h-10 grow rounded-full border border-white/15 text-sm font-semibold text-cream"
            >
              {t.cancel}
            </button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-[26px] border border-gold/35 bg-gold/[0.07] p-4">
          <h2 className="text-xl font-extrabold text-white">{t.joinTitle}</h2>
          <p className="text-[15px] leading-normal text-cream/80">{t.joinText}</p>
          <button type="button" onClick={() => setPlans(true)} className="gold-grad flex h-12 items-center justify-center gap-1.5 rounded-full text-[15px] font-bold text-ink">
            {t.seePlans} <IconChevron size={18} stroke="#08090B" weight={2.2} />
          </button>
        </section>
      )}

      {/* Reservas próximas */}
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-lg font-extrabold text-white">{t.yourBookings}</h2>
          {upcoming.map((b) => {
            const c = getCar(b.car);
            return (
              <div key={b.code} className="flex items-center gap-3 rounded-[20px] border border-line bg-card p-3">
                <div className="grow">
                  <p className="text-[15px] font-bold text-white">
                    {c?.name[locale] ?? b.car} · <span className="text-gold-soft">{b.credits ? t.credits(b.credits) : money(b.cash)}</span>
                  </p>
                  <p className="text-[13px] text-mute">
                    {t.bookingLine(fmtDate(b.from), fmtDate(b.to), b.addr)} · {b.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    carStore.cancelBooking(b.code);
                    show(t.bookingCanceled);
                  }}
                  className="h-9 shrink-0 rounded-full border border-white/15 px-3.5 text-[13px] font-semibold text-cream"
                >
                  {t.cancel}
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* Flota */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-white">{t.fleet}</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {carCats.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${filter === c.id ? "bg-cream text-ink" : "border border-white/10 bg-white/[0.04] text-cream"}`}
            >
              {c.name[locale]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {shown.map((c) => {
            const cat = carCats.find((x) => x.id === c.cat)!;
            return (
              <button key={c.id} type="button" onClick={() => setOpenId(c.id)} className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-card text-left">
                <span className="relative block">
                  <CarArt car={c} className="block aspect-[2/1] w-full" />
                  <span className="glass absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-cream/90">{cat.short[locale]}</span>
                  {c.founders && (
                    <span className="gold-grad absolute right-2 bottom-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-ink">
                      <IconCrown size={10} stroke="#08090B" weight={2.2} /> {t.founders}
                    </span>
                  )}
                </span>
                <span className="flex flex-col gap-0.5 p-3">
                  <span className="text-[14px] leading-tight font-bold text-white">{c.name[locale]}</span>
                  <span className="text-[12px] text-mute">
                    {c.hp} hp · {c.seats} {t.seats.toLowerCase()} · {c.color[locale]}
                  </span>
                  <span className="mt-1 text-[13px] font-bold text-gold-soft">
                    {t.credits(c.credits)}
                    {t.perDay} · <span className="text-cream/80">{money(c.cash)}{t.perDay}</span>
                  </span>
                  {tier && !carAllowed(c, tier) && <span className="text-[11px] font-semibold text-[#EA9272]">{t.needsHigher}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[12px] leading-normal text-mute">{t.note}</p>
      </section>

      {plans && (
        <Sheet label={t.plansTitle} closeLabel={t.close} onClose={closePlans}>
          <h2 className="pr-10 text-2xl font-extrabold text-white">{t.plansTitle}</h2>
          <p className="text-[15px] text-mute">{t.plansText}</p>
          {tiers.map((p) => {
            const mine = state.tier === p.id;
            return (
              <div key={p.id} className={`flex flex-col gap-2.5 rounded-[22px] border p-4 ${mine ? "border-gold/60 bg-gold/[0.08]" : "border-line bg-raised/40"}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-white">{p.name}</span>
                  <span className="text-[15px] font-bold text-gold-soft">
                    {money(p.price)}
                    {t.perMonth}
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {p.perks.map((k) => (
                    <li key={k.es} className="flex items-center gap-2 text-sm text-cream/85">
                      <IconCheck size={15} stroke="#D8B170" weight={2.2} /> {k[locale]}
                    </li>
                  ))}
                </ul>
                {mine ? (
                  <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-[13px] font-bold text-gold-soft">{t.yourPlan}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      carStore.join(p.id);
                      setPlans(false);
                      show(t.activated(p.name));
                    }}
                    className="gold-grad h-11 rounded-full text-[15px] font-bold text-ink"
                  >
                    {t.activate(p.name)}
                  </button>
                )}
              </div>
            );
          })}
          <p className="text-[12px] leading-normal text-mute">{t.plansNote}</p>
        </Sheet>
      )}

      {open && (
        <CarSheet
          key={open.id}
          car={open}
          locale={locale}
          onClose={closeCar}
          onPlans={() => {
            setOpenId(null);
            setPlans(true);
          }}
        />
      )}
    </div>
  );
}

function CarSheet({ car, locale, onClose, onPlans }: { car: Car; locale: Locale; onClose: () => void; onPlans: () => void }) {
  const t = dict(locale).cars;
  const { show } = useToast();
  const state = useCars();
  const tier = getTier(state.tier);
  const money = (n: number) => formatPrice(n, locale);
  const [from, setFrom] = useState(isoDay(1));
  const [to, setTo] = useState(isoDay(1));
  const [addr, setAddr] = useState(state.addr);

  const days = carDays(from, to);
  const credits = car.credits * days;
  const cash = car.cash * days;
  const left = tier ? Math.max(0, tier.credits - state.used) : 0;
  const allowed = carAllowed(car, tier);
  const cat = carCats.find((x) => x.id === car.cat)!;

  function book(withCash: boolean) {
    const where = addr.trim();
    if (!where) return show(t.needAddr);
    if (!withCash) {
      if (!tier) return onPlans();
      if (!allowed) return show(t.planMissing);
      if (credits > left) return show(t.short(credits - left));
    }
    carStore.book({ car: car.id, from, to, addr: where, credits: withCash ? 0 : credits, cash: withCash ? cash : 0 });
    onClose();
    show(t.booked(withCash ? money(cash) : t.credits(credits)));
  }

  const field = "h-12 w-full rounded-[14px] border border-white/10 bg-ink/60 px-3.5 text-[15px] text-cream outline-none focus:border-gold/60";

  return (
    <Sheet label={car.name[locale]} closeLabel={t.close} onClose={onClose}>
      <div className="relative -mx-5 -mt-5 overflow-hidden rounded-t-[28px]">
        <CarArt car={car} className="block aspect-[16/9] w-full" />
        <span className="gold-grad absolute bottom-3 left-4 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink">{cat.name[locale]}</span>
      </div>
      <h2 className="text-2xl font-extrabold text-white">{car.name[locale]}</h2>
      <p className="text-[15px] text-mute">{car.desc[locale]}</p>
      <dl className="grid grid-cols-4 gap-2">
        {[
          [`${car.hp} hp`, t.power],
          [String(car.seats), t.seats],
          [`${car.miles} mi`, t.included],
          [car.color[locale], t.color],
        ].map(([v, k]) => (
          <div key={k} className="flex flex-col gap-0.5 rounded-[14px] border border-line bg-raised/40 p-2.5">
            <dt className="text-[10px] font-semibold text-mute uppercase">{k}</dt>
            <dd className="text-[13px] leading-tight font-bold text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-mute">
          {t.from}
          <input
            type="date"
            min={isoDay()}
            value={from}
            onChange={(e) => {
              const v = e.target.value;
              setFrom(v);
              if (to < v) setTo(v);
            }}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-mute">
          {t.to}
          <input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value < from ? from : e.target.value)} className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-mute">
        {t.delivery}
        <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder={t.addrPlaceholder} autoComplete="street-address" className={field} />
      </label>

      <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-raised/40 p-3.5 text-sm">
        <div className="flex justify-between text-cream">
          <span>{t.days(days)}</span>
          <span className="font-bold text-gold-soft">{t.credits(credits)}</span>
        </div>
        <div className="flex justify-between text-cream/80">
          <span>{t.noMember}</span>
          <span className="font-semibold">{money(cash)}</span>
        </div>
        {tier && (
          <div className="flex justify-between text-cream/80">
            <span>{t.youHave}</span>
            <span className="font-semibold">{t.credits(left)}</span>
          </div>
        )}
      </div>

      {tier && !allowed && (
        <p className="text-sm text-[#EA9272]">
          {car.founders ? t.foundersOnly : t.notInPlan(tier.name)}{" "}
          <button type="button" onClick={onPlans} className="font-bold text-gold-soft underline">
            {t.seePlans}
          </button>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => book(true)} className="h-12 rounded-full border border-white/15 px-2 text-[14px] font-semibold text-cream">
          {t.bookCash}
        </button>
        <button
          type="button"
          onClick={() => (tier ? book(false) : onPlans())}
          disabled={!!tier && !allowed}
          className="gold-grad h-12 rounded-full px-2 text-[14px] font-bold text-ink disabled:opacity-40"
        >
          {tier ? t.useCredits : t.needsPlan}
        </button>
      </div>
      <p className="text-[12px] leading-normal text-mute">{t.rules}</p>
    </Sheet>
  );
}
