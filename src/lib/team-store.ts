"use client";

// "Tu equipo" de Talento, guardado en este teléfono hasta la Fase 2.
import { createLocalStore } from "./local-store";

export type Hire = { uid: string; id: string; candidate: string; mult: number; hours: number };

const store = createLocalStore<Hire>("ark305:team");

export const useTeam = store.useItems;

export const team = {
  add(h: Omit<Hire, "uid">) {
    store.write([...store.read(), { ...h, uid: Math.random().toString(36).slice(2, 10) }]);
  },
  remove(uid: string) {
    store.write(store.read().filter((h) => h.uid !== uid));
  },
};
