// ARK IA en Business: arma un equipo a partir de lo que necesita tu negocio.
// Vista previa por palabras clave; la integración futura con Meta conservará el formato.
import type { Locale } from "./locale";
import { monthly, positions } from "./talent";

const RULES: { words: string[]; roles: [string, number][] }[] = [
  { words: ["redes", "social", "instagram", "tiktok", "contenido", "reels", "content", "posts"], roles: [["r-reel", 20], ["r-cm", 20]] },
  { words: ["mensajes", "dms", "whatsapp", "atencion", "clientes", "soporte", "messages", "support", "no doy abasto"], roles: [["r-cs", 20]] },
  { words: ["ventas", "leads", "citas", "prospectos", "cerrar", "sales", "appointments", "closing"], roles: [["r-setter", 40], ["r-closer", 20]] },
  { words: ["crm", "gohighlevel", "automatiz", "seguimiento", "follow"], roles: [["r-crm", 10]] },
  { words: ["web", "pagina", "sitio", "website"], roles: [["r-web", 20]] },
  { words: ["anuncios", "ads", "meta", "google", "publicidad"], roles: [["r-ads", 10]] },
  { words: ["diseno", "logo", "marca", "design", "brand"], roles: [["r-gd", 10]] },
  { words: ["contabilidad", "facturas", "libros", "impuestos", "bookkeeping", "invoices", "accounting"], roles: [["r-book", 10], ["r-bill", 10]] },
  { words: ["asistente", "agenda", "correo", "admin", "assistant", "email"], roles: [["r-va", 20]] },
  { words: ["videografo", "video", "grabar", "filmar", "videographer", "film"], roles: [["rec", 5]] },
  { words: ["fotografo", "fotos", "photographer", "photos"], roles: [["photo", 5]] },
  { words: ["airbnb", "huespedes", "host", "alquiler"], roles: [["r-cohost", 20], ["turn", 0]] },
  { words: ["remodel", "cocina", "bano", "kitchen", "bathroom"], roles: [["estimate", 0], ["kitchen", 0]] },
];

const norm = (s: string) => ` ${s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")} `;

export type TeamLine = { id: string; hours: number; monthly: number };
export type TeamPlan = { lines: TeamLine[]; hoursPerWeek: number; total: number; understood: boolean };

export function planTeam(prompt: string): TeamPlan {
  const text = norm(prompt);
  const picked = new Map<string, number>();
  for (const r of RULES) if (r.words.some((w) => new RegExp(`(^|[^a-z])${w}`).test(text))) r.roles.forEach(([id, h]) => picked.set(id, Math.max(picked.get(id) ?? 0, h)));
  const understood = picked.size > 0;
  if (!understood) [["r-reel", 20], ["r-cm", 20], ["r-gd", 10]].forEach(([id, h]) => picked.set(id as string, h as number));

  const lines = [...picked].map(([id, hours]) => {
    const p = positions.find((x) => x.id === id)!;
    const cost = p.unit === "h" ? monthly(p.rate, hours || 5) : p.unit === "q" ? 0 : p.rate;
    return { id, hours: p.unit === "h" ? hours || 5 : 0, monthly: cost };
  });
  return {
    lines,
    hoursPerWeek: lines.reduce((s, l) => s + l.hours, 0),
    total: lines.reduce((s, l) => s + l.monthly, 0),
    understood,
  };
}

// Tono profesional: directo, con números.
export function teamSummary(plan: TeamPlan, locale: Locale, money: (n: number) => string) {
  const n = plan.lines.length;
  if (locale === "es") {
    const head = plan.understood ? "Propuesta" : "No tengo todos los datos. Propuesta base";
    return `${head}: ${n} ${n === 1 ? "rol" : "roles"}, ${plan.hoursPerWeek} h/semana, ${money(plan.total)}/mes. ¿Lo agrego a tu equipo y genero el contrato?`;
  }
  const head = plan.understood ? "Proposal" : "I don't have all the details. Baseline proposal";
  return `${head}: ${n} ${n === 1 ? "role" : "roles"}, ${plan.hoursPerWeek} h/week, ${money(plan.total)}/month. Add it to your team and generate the contract?`;
}
