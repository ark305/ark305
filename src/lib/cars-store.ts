"use client";

// Membresía y reservas de ARK CARS, guardadas en este teléfono (como "Mi día").
import { createLocalValue } from "./local-store";
import type { TierId } from "./cars";

export type CarBooking = { code: string; car: string; from: string; to: string; addr: string; credits: number; cash: number; at: number };
export type CarState = { tier: TierId | null; used: number; cycle: string; bookings: CarBooking[]; addr: string };

const month = () => new Date().toISOString().slice(0, 7); // "2026-10"
const store = createLocalValue<CarState>("ark305:cars", { tier: null, used: 0, cycle: "", bookings: [], addr: "" });

// Los créditos se renuevan el 1 de cada mes y no se acumulan.
function current(): CarState {
  const s = store.read();
  return s.cycle === month() ? s : { ...s, used: 0, cycle: month() };
}

export const useCars = () => {
  const s = store.useValue();
  return s.cycle === month() ? s : { ...s, used: 0 };
};

export const carStore = {
  // Cambiar de plan no reinicia los créditos usados del mes.
  join(tier: TierId) {
    store.write({ ...current(), tier });
  },
  cancel() {
    store.write({ ...current(), tier: null });
  },
  book(b: Omit<CarBooking, "code" | "at">) {
    const s = current();
    const booking: CarBooking = { ...b, code: `CAR-${1000 + Math.floor(Math.random() * 9000)}`, at: Date.now() };
    store.write({ ...s, used: s.used + b.credits, addr: b.addr, bookings: [...s.bookings, booking] });
    return booking;
  },
  // Cancelar devuelve los créditos de esa reserva.
  cancelBooking(code: string) {
    const s = current();
    const b = s.bookings.find((x) => x.code === code);
    if (!b) return;
    const sameMonth = new Date(b.at).toISOString().slice(0, 7) === s.cycle;
    store.write({ ...s, used: sameMonth ? Math.max(0, s.used - b.credits) : s.used, bookings: s.bookings.filter((x) => x.code !== code) });
  },
};
