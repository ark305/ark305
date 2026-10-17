// Mapa ARK: nodos de la red sobre Miami. Datos de demostración (coordenadas aproximadas por barrio).
import type { Localized } from "./locale";
import { hoodDemand } from "./developers";
import { residences } from "./private";

export type MapKind = "residence" | "provider" | "demand";
export type MapNode = { id: string; kind: MapKind; name: string; sub: Localized; lat: number; lng: number; size?: number };

export const HOODS: Record<string, [number, number]> = {
  Brickell: [25.7617, -80.1918],
  Edgewater: [25.798, -80.188],
  "Miami Beach": [25.8105, -80.1395],
  "Key Biscayne": [25.693, -80.1626],
  "Coral Gables": [25.7215, -80.2684],
  "Coconut Grove": [25.728, -80.243],
  Wynwood: [25.801, -80.199],
};

export const MIAMI_CENTER: [number, number] = [25.765, -80.2];

const providers: { id: string; name: string; sub: Localized; at: [number, number] }[] = [
  { id: "p-drive", name: "Elite Drive MIA", sub: { es: "Chofer privado · $85/h · 4.9", en: "Private driver · $85/hr · 4.9" }, at: [25.7935, -80.1975] },
  { id: "p-yacht", name: "Biscayne Yacht Co", sub: { es: "Yate 60 ft · $450/h · 5.0", en: "60 ft yacht · $450/hr · 5.0" }, at: [25.7785, -80.1867] },
  { id: "p-chef", name: "Chef Laurent", sub: { es: "Chef privado · $150/persona · 4.8", en: "Private chef · $150/person · 4.8" }, at: [25.7505, -80.2105] },
  { id: "p-films", name: "ARK Films", sub: { es: "Videógrafo · $750/día · 5.0", en: "Videographer · $750/day · 5.0" }, at: [25.7665, -80.1945] },
  { id: "p-luz", name: "Luz Studio", sub: { es: "Fotógrafo · $500/día · 4.9", en: "Photographer · $500/day · 4.9" }, at: [25.7495, -80.2595] },
  { id: "p-clean", name: "Pristine MIA", sub: { es: "Limpieza · $45/h · 4.7", en: "Cleaning · $45/hr · 4.7" }, at: [25.7865, -80.1335] },
  { id: "p-daniel", name: "Daniel M.", sub: { es: "Videógrafo · Wynwood", en: "Videographer · Wynwood" }, at: [25.8035, -80.2015] },
];

// Pequeño desplazamiento para que dos nodos del mismo barrio no se encimen.
const nudge = (p: [number, number], i: number): [number, number] => [p[0] + ((i % 3) - 1) * 0.004, p[1] + ((i % 2) * 2 - 1) * 0.004];

export const mapNodes: MapNode[] = [
  ...residences.map((r, i) => {
    const [lat, lng] = nudge(HOODS[r.hood] ?? MIAMI_CENTER, i);
    return { id: r.id, kind: "residence" as const, name: r.name, sub: { es: `${r.hood} · desde ${r.from} · ${r.developer}`, en: `${r.hood} · from ${r.from} · ${r.developer}` }, lat, lng };
  }),
  ...providers.map((p) => ({ id: p.id, kind: "provider" as const, name: p.name, sub: p.sub, lat: p.at[0], lng: p.at[1] })),
  ...hoodDemand.map((h) => {
    const [lat, lng] = HOODS[h.hood] ?? MIAMI_CENTER;
    return { id: `d-${h.hood}`, kind: "demand" as const, name: h.hood, sub: { es: `${h.buyers} compradores · ${h.budget}`, en: `${h.buyers} buyers · ${h.budget}` }, lat, lng, size: h.buyers };
  }),
];

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
