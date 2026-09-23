"use client";

// Lo que el feed aprende de ti: puntos por tema, guardados y posts ocultos.
// Se guarda en el teléfono; si entraste, los puntos también se copian a tu cuenta.
import { useSyncExternalStore } from "react";
import { saveTaste } from "./actions";
import type { Topic } from "./mock-data";

type State = { taste: Partial<Record<Topic, number>>; saved: string[]; hidden: string[]; seen: string[] };
const KEY = "ark305:taste";
const EMPTY: State = { taste: {}, saved: [], hidden: [], seen: [] };
const listeners = new Set<() => void>();
let cache: State | null = null;
let signedIn = false;
let syncTimer: ReturnType<typeof setTimeout> | undefined;

function read(): State {
  if (cache) return cache;
  try {
    cache = { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) ?? "null") ?? {}) };
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: State, sync = false) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // sin almacenamiento: aprende solo mientras la página está abierta
  }
  listeners.forEach((l) => l());
  if (sync && signedIn) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => saveTaste(next.taste as Record<string, number>), 1500);
  }
}

export function useTaste() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

// Cuánto pesa cada acción.
export const WEIGHTS = { view: 1, like: 2, save: 4, book: 8, hide: -6 } as const;

export const taste = {
  // Al entrar con tu cuenta, trae lo aprendido en otro teléfono.
  init(fromAccount: Record<string, number> | null | undefined, isSignedIn: boolean) {
    signedIn = isSignedIn;
    const s = read();
    if (fromAccount && Object.keys(s.taste).length === 0 && Object.keys(fromAccount).length) write({ ...s, taste: fromAccount });
  },
  bump(topic: Topic, signal: keyof typeof WEIGHTS) {
    const s = read();
    write({ ...s, taste: { ...s.taste, [topic]: (s.taste[topic] ?? 0) + WEIGHTS[signal] } }, signal !== "view");
  },
  seen(id: string, topic: Topic) {
    const s = read();
    if (s.seen.includes(id)) return;
    write({ ...s, seen: [...s.seen, id].slice(-200), taste: { ...s.taste, [topic]: (s.taste[topic] ?? 0) + WEIGHTS.view } });
  },
  toggleSave(id: string, topic: Topic) {
    const s = read();
    const on = s.saved.includes(id);
    write({ ...s, saved: on ? s.saved.filter((x) => x !== id) : [...s.saved, id], taste: { ...s.taste, [topic]: (s.taste[topic] ?? 0) + (on ? -WEIGHTS.save : WEIGHTS.save) } }, true);
  },
  hide(id: string, topic: Topic) {
    const s = read();
    write({ ...s, hidden: [...s.hidden, id], taste: { ...s.taste, [topic]: (s.taste[topic] ?? 0) + WEIGHTS.hide } }, true);
  },
  reset() {
    write(EMPTY, true);
  },
};
