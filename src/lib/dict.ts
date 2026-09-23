// Diccionario para pantallas interactivas (se ejecutan en el teléfono).
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import type { Locale } from "./locale";

export const dict = (locale: Locale) => (locale === "es" ? es : en);

export function formatTime(time: string, locale: Locale) {
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, h, m));
}
