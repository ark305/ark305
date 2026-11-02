"use client";

// The planning draft stays in this browser; submitted requests are stored separately.
import type { DayEntry } from "./catalog";
import { createLocalStore } from "./local-store";

const store = createLocalStore<DayEntry>("ark305:day");
const uid = () => Math.random().toString(36).slice(2, 10);

export const useDay = store.useItems;

const guestStore = createLocalStore<number>("ark305:planner-guests");
const validGuests = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 20;

export function usePlannerGuests() {
  const preference = guestStore.useItems();
  const entries = useDay();
  if (Array.isArray(preference) && validGuests(preference[0])) return preference[0];
  const first = entries[0]?.guests;
  return validGuests(first) && entries.every((entry) => entry.guests === first) ? first : 4;
}

export const plannerGuests = {
  set(value: number) {
    if (validGuests(value)) guestStore.write([value]);
  },
};

export const day = {
  add(items: Omit<DayEntry, "uid">[]) {
    const merged = [...store.read(), ...items.map((i) => ({ ...i, uid: uid() }))];
    merged.sort((a, b) => a.time.localeCompare(b.time));
    store.write(merged);
  },
  remove(id: string) {
    store.write(store.read().filter((e) => e.uid !== id));
  },
  clear() {
    store.write([]);
  },
};
