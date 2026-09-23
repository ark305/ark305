import "server-only";
import { cookies, headers } from "next/headers";
import { es } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import type { Locale } from "./locale";
import { experienceToSide, parseLevel, parseSide } from "./mode";
import { getViewer } from "./profiles-db";

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
  // Personal o Business: se guarda en la cuenta; en el teléfono (cookie) para invitados.
  // (Las cookies "exp" y "mode" son de la versión anterior y solo se usan si no hay otra cosa.)
  const viewer = await getViewer();
  const side =
    parseSide(jar.get("side")?.value) ??
    experienceToSide(viewer.row?.experience) ??
    experienceToSide(jar.get("exp")?.value) ??
    (jar.get("mode")?.value === "ofrecer" ? "business" : null);
  const current = side ?? "personal";
  return {
    locale,
    t,
    side,
    level: parseLevel(jar.get("nivel")?.value),
    // Nombres de antes, derivados del interruptor, para las pantallas que ya existían.
    mode: current === "business" ? ("ofrecer" as const) : ("buscar" as const),
    view: current === "business" ? ("business" as const) : ("lifestyle" as const),
    exp: current === "business" ? ("business" as const) : ("lifestyle" as const),
    diagnosis: (viewer.row?.diagnosis ?? null) as Record<string, unknown> | null,
  };
}
