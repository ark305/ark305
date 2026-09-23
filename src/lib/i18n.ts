import "server-only";
import { cookies, headers } from "next/headers";
import { es } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import type { Locale } from "./locale";
import { parseLevel, parseMode } from "./mode";

export type { Locale } from "./locale";
export type Dictionary = typeof es;

const dictionaries: Record<Locale, Dictionary> = { es, en };

// Idioma: primero lo que la persona eligió (cookie), si no, el idioma del teléfono.
// Español por defecto, igual que la versión anterior.
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get("lang")?.value;
  if (chosen === "es" || chosen === "en") return chosen;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^en/i.test(accept) ? "en" : "es";
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

// Todo lo que una pantalla necesita saber de la persona: idioma, modo y nivel.
export async function getContext() {
  const jar = await cookies();
  const { locale, t } = await getDictionary();
  return { locale, t, mode: parseMode(jar.get("mode")?.value), level: parseLevel(jar.get("nivel")?.value) };
}
