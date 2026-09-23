"use client";

// "Tu día" se guarda en este teléfono mientras no hay inicio de sesión (Fase 2).
import { useSyncExternalStore } from "react";
import type { DayEntry } from "./catalog";

const KEY = "ark305:day";
const EMPTY: DayEntry[] = [];
const listeners = new Set<() => void>();
let cache: DayEntry[] | null = null;

function read(): DayEntry[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as DayEntry[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: DayEntry[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // sin almacenamiento (modo privado): el día vive solo mientras la página está abierta
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDay() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const day = {
  add(items: Omit<DayEntry, "uid">[]) {
    const merged = [...read(), ...items.map((i) => ({ ...i, uid: uid() }))];
    merged.sort((a, b) => a.time.localeCompare(b.time));
    write(merged);
  },
  remove(id: string) {
    write(read().filter((e) => e.uid !== id));
  },
  clear() {
    write(EMPTY);
  },
};
