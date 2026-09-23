// Modo (Buscar u Ofrecer) y nivel (Personal, Business o VIP).
// Por ahora se guardan en una cookie del navegador. Con el inicio de sesión (Fase 2)
// y los pagos (Fase 4) pasan a la cuenta de cada persona.

export type Mode = "buscar" | "ofrecer";
export type Level = "personal" | "business" | "vip";

export const MODE_HOME: Record<Mode, string> = { buscar: "/", ofrecer: "/panel" };

export function parseMode(v: string | undefined): Mode {
  return v === "ofrecer" ? "ofrecer" : "buscar";
}

export function parseLevel(v: string | undefined): Level {
  return v === "business" || v === "vip" ? v : "personal";
}

export const LEVEL_COLOR: Record<Level, string> = {
  personal: "#EFE6D8",
  business: "#8FB0D0",
  vip: "#D8B170",
};

// Experiencia: qué le interesa a la persona. Lifestyle (vivir experiencias), Business (talento,
// equipos y reventa) o las dos. Con "las dos", el lente elige qué se ve ahora mismo.
export type Experience = "lifestyle" | "business" | "both";
export type Lens = "all" | "lifestyle" | "business";
export type View = "lifestyle" | "business";

export function parseExperience(v: string | undefined | null): Experience | null {
  return v === "lifestyle" || v === "business" || v === "both" ? v : null;
}

export function parseLens(v: string | undefined): Lens {
  return v === "lifestyle" || v === "business" ? v : "all";
}

// Qué experiencia se está mostrando (define colores, pantallas y el tono de la IA).
export function viewOf(exp: Experience | null, lens: Lens): View {
  if (exp === "business") return "business";
  if (exp === "both" && lens === "business") return "business";
  return "lifestyle";
}
