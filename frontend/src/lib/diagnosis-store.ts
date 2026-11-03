"use client";

// Respuestas del Diagnóstico en este teléfono (para invitados). Con cuenta, también en Supabase.
import { useSyncExternalStore } from "react";
import type { Answers } from "./diagnosis";

const KEY = "ark305:diagnosis";
const listeners = new Set<() => void>();
let cache: Answers | null | undefined;

function read(): Answers | null {
  if (cache !== undefined) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    cache = null;
  }
  return cache ?? null;
}

export function writeDiagnosis(a: Answers | null) {
  cache = a;
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch {
    // sin almacenamiento: queda solo en la cuenta (si hay)
  }
  listeners.forEach((l) => l());
}

export function useLocalDiagnosis() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => null,
  );
}
