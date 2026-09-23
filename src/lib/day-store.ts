"use client";

// "Tu día" se guarda en este teléfono mientras no hay inicio de sesión (Fase 2).
import type { DayEntry } from "./catalog";
import { createLocalStore } from "./local-store";

const store = createLocalStore<DayEntry>("ark305:day");
const uid = () => Math.random().toString(36).slice(2, 10);

export const useDay = store.useItems;

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
