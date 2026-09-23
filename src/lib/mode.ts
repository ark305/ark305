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
