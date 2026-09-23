"use client";

// Listas que se guardan en este teléfono mientras no hay inicio de sesión (Fase 2).
import { useSyncExternalStore } from "react";

export function createLocalStore<T>(key: string) {
  const EMPTY: T[] = [];
  const listeners = new Set<() => void>();
  let cache: T[] | null = null;

  const read = (): T[] => {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T[]) : EMPTY;
    } catch {
      cache = EMPTY;
    }
    return cache;
  };

  const write = (next: T[]) => {
    cache = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // sin almacenamiento (modo privado): la lista vive solo mientras la página está abierta
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    read,
    write,
    useItems: () => useSyncExternalStore(subscribe, read, () => EMPTY),
  };
}
