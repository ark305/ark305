// Mapa ARK: nodos de la red sobre Miami. Datos de demostración (coordenadas aproximadas por barrio).
import type { ServiceType } from "./booking";
import { clubs } from "./clubs";
import type { Localized } from "./locale";
import { hoodDemand } from "./developers";
import { residences } from "./private";

export type MapKind = "residence" | "provider" | "ally" | "demand";
export const MAP_KINDS: MapKind[] = ["residence", "provider", "ally", "demand"];
export type MapNode = {
  id: string;
  kind: MapKind;
  name: string;
  sub: Localized;
  lat: number;
  lng: number;
  hood: string;
  href: string;
  size?: number;
  service?: ServiceType;
  priceM?: number; // residencias: precio desde, en US$ millones
  availableNow?: boolean;
};

export type PriceBand = "all" | "lt3" | "3to6" | "gt6";
export const PRICE_BANDS: PriceBand[] = ["all", "lt3", "3to6", "gt6"];
export const inBand = (m: number | undefined, b: PriceBand) =>
  b === "all" || m === undefined || (b === "lt3" ? m < 3 : b === "3to6" ? m >= 3 && m <= 6 : m > 6);

export const HOODS: Record<string, [number, number]> = {
  Brickell: [25.7617, -80.1918],
  Edgewater: [25.798, -80.188],
  "Miami Beach": [25.8105, -80.1395],
  "Key Biscayne": [25.693, -80.1626],
  "Coral Gables": [25.7215, -80.2684],
  "Coconut Grove": [25.728, -80.243],
  Wynwood: [25.801, -80.199],
  "Design District": [25.8128, -80.1934],
  "Brickell Key": [25.768, -80.1857],
};

export const MIAMI_CENTER: [number, number] = [25.765, -80.2];

const providers: { id: string; name: string; sub: Localized; at: [number, number]; hood: string; service: ServiceType; now: boolean }[] = [
  { id: "p-drive", name: "Elite Drive MIA", sub: { es: "Chofer privado · $85/h · 4.9", en: "Private driver · $85/hr · 4.9" }, at: [25.7935, -80.1975], hood: "Wynwood", service: "driver", now: true },
  { id: "p-yacht", name: "Biscayne Yacht Co", sub: { es: "Yate 60 ft · $450/h · 5.0", en: "60 ft yacht · $450/hr · 5.0" }, at: [25.7785, -80.1867], hood: "Edgewater", service: "yacht", now: true },
  { id: "p-chef", name: "Chef Laurent", sub: { es: "Chef privado · $150/persona · 4.8", en: "Private chef · $150/person · 4.8" }, at: [25.7505, -80.2105], hood: "Brickell", service: "chef", now: false },
  { id: "p-films", name: "ARK Films", sub: { es: "Videógrafo · $750/día · 5.0", en: "Videographer · $750/day · 5.0" }, at: [25.7665, -80.1945], hood: "Brickell", service: "videographer", now: true },
  { id: "p-luz", name: "Luz Studio", sub: { es: "Fotógrafo · $500/día · 4.9", en: "Photographer · $500/day · 4.9" }, at: [25.7495, -80.2595], hood: "Coral Gables", service: "photographer", now: false },
  { id: "p-clean", name: "Pristine MIA", sub: { es: "Limpieza · $45/h · 4.7", en: "Cleaning · $45/hr · 4.7" }, at: [25.7865, -80.1335], hood: "Miami Beach", service: "cleaning", now: true },
  { id: "p-daniel", name: "Daniel M.", sub: { es: "Videógrafo · Wynwood", en: "Videographer · Wynwood" }, at: [25.8035, -80.2015], hood: "Wynwood", service: "videographer", now: true },
];

// Pequeño desplazamiento para que dos nodos del mismo barrio no se encimen.
const nudge = (p: [number, number], i: number): [number, number] => [p[0] + ((i % 3) - 1) * 0.004, p[1] + ((i % 2) * 2 - 1) * 0.004];

const priceM = (from: string) => Number(from.replace(/[^0-9.]/g, "")) || undefined;

export const mapNodes: MapNode[] = [
  ...residences.map((r, i) => {
    const [lat, lng] = nudge(HOODS[r.hood] ?? MIAMI_CENTER, i);
    return { id: r.id, kind: "residence" as const, name: r.name, sub: { es: `${r.hood} · desde ${r.from} · ${r.developer}`, en: `${r.hood} · from ${r.from} · ${r.developer}` }, lat, lng, hood: r.hood, href: "/private", priceM: priceM(r.from) };
  }),
  ...providers.map((p) => ({ id: p.id, kind: "provider" as const, name: p.name, sub: p.sub, lat: p.at[0], lng: p.at[1], hood: p.hood, href: `/reservar?tipo=${p.service}`, service: p.service, availableNow: p.now })),
  ...clubs.flatMap((c) =>
    c.allies.map((a, i) => {
      const [lat, lng] = nudge(HOODS[a.hood] ?? MIAMI_CENTER, i + 4);
      return { id: `a-${c.slug}-${a.id}`, kind: "ally" as const, name: a.name, sub: { es: `${c.short} · ${a.benefit.es}`, en: `${c.short} · ${a.benefit.en}` }, lat: lat + 0.002, lng: lng - 0.002, hood: a.hood, href: `/club?c=${c.slug}` };
    }),
  ),
  ...hoodDemand.map((h) => {
    const [lat, lng] = HOODS[h.hood] ?? MIAMI_CENTER;
    return { id: `d-${h.hood}`, kind: "demand" as const, name: h.hood, sub: { es: `${h.buyers} compradores · ${h.budget}`, en: `${h.buyers} buyers · ${h.budget}` }, lat, lng, hood: h.hood, href: "/developers", size: h.buyers };
  }),
];

export const MAP_HOODS = [...new Set(mapNodes.map((n) => n.hood))].sort();

// Recorrido demo del seguimiento en vivo: Elite Drive MIA de Wynwood a Bayfront Residences (Brickell).
export const demoRoute: [number, number][] = [
  [25.7935, -80.1975],
  [25.7905, -80.1935],
  [25.7865, -80.1902],
  [25.781, -80.189],
  [25.7745, -80.1905],
  [25.77, -80.1915],
  [25.7655, -80.1918],
  [25.7617, -80.1918],
];
export const DEMO_TRIP_MIN = 12; // minutos que simula el recorrido
