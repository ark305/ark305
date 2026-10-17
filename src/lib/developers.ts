// ARK Developer Access: suscripción por invitación para desarrolladores inmobiliarios.
// Todo es demo: precios, cupos, compradores y demanda son ficticios.
import type { Localized } from "./locale";

export type DevTier = {
  id: "partner" | "signature" | "founding";
  name: string;
  price: Localized;
  tagline: Localized;
  seats: Localized;
  perks: Localized[];
};

export const devTiers: DevTier[] = [
  {
    id: "partner",
    name: "Partner",
    price: { es: "$4,500 / mes", en: "$4,500 / month" },
    tagline: { es: "Un proyecto conectado a la demanda de ARK.", en: "One project plugged into ARK demand." },
    seats: { es: "7 de 12 cupos disponibles", en: "7 of 12 seats open" },
    perks: [
      { es: "1 proyecto activo", en: "1 active project" },
      { es: "Compradores calificados del ecosistema ARK en tu barrio", en: "Qualified buyers from the ARK ecosystem in your area" },
      { es: "Panel de demanda y comparables del MLS", en: "Demand dashboard and MLS comparables" },
      { es: "Servicios ARK para tus compradores con 10%", en: "ARK services for your buyers at 10% off" },
    ],
  },
  {
    id: "signature",
    name: "Signature",
    price: { es: "$12,000 / mes", en: "$12,000 / month" },
    tagline: { es: "Varios proyectos y primera fila en cada deal.", en: "Multiple projects and front row on every deal." },
    seats: { es: "2 de 6 cupos disponibles", en: "2 of 6 seats open" },
    perks: [
      { es: "Hasta 4 proyectos", en: "Up to 4 projects" },
      { es: "48 h de prioridad sobre cada comprador nuevo", en: "48 h priority on every new buyer" },
      { es: "Colocación off-market dentro de ARK Private", en: "Off-market placement inside ARK Private" },
      { es: "Match y alertas con ARK IA", en: "ARK AI matching and alerts" },
      { es: "Servicios ARK con 15% y tu marca", en: "ARK services at 15% off, under your brand" },
    ],
  },
  {
    id: "founding",
    name: "Founding",
    price: { es: "$30,000 / mes", en: "$30,000 / month" },
    tagline: { es: "Exclusiva por barrio. Un solo developer por zona.", en: "Neighborhood exclusive. One developer per area." },
    seats: { es: "3 de 6 barrios disponibles", en: "3 of 6 neighborhoods open" },
    perks: [
      { es: "Exclusiva en tu barrio: primera opción en todo comprador que encaja", en: "Exclusive in your area: first option on every matching buyer" },
      { es: "Eventos privados y co-marketing con ARK", en: "Private events and co-marketing with ARK" },
      { es: "Reporte trimestral de demanda y data room", en: "Quarterly demand report and data room" },
      { es: "Concierge dedicado para tus compradores", en: "Dedicated concierge for your buyers" },
    ],
  },
];

export type HoodDemand = { hood: string; buyers: number; budget: string; need: Localized };

export const hoodDemand: HoodDemand[] = [
  { hood: "Brickell", buyers: 46, budget: "$2–4M", need: { es: "Cerca de la oficina + gestión de renta", en: "Near the office + rental management" } },
  { hood: "Miami Beach", buyers: 31, budget: "$6–15M", need: { es: "Frente al agua + yate", en: "Waterfront + yacht" } },
  { hood: "Edgewater", buyers: 27, budget: "$1.5–3M", need: { es: "Primera residencia en Miami", en: "First home in Miami" } },
  { hood: "Coral Gables", buyers: 22, budget: "$2–5M", need: { es: "Casa familiar + interiorismo", en: "Family home + interiors" } },
  { hood: "Key Biscayne", buyers: 18, budget: "$5–9M", need: { es: "Colegios + seguridad", en: "Schools + security" } },
  { hood: "Coconut Grove", buyers: 15, budget: "$3–6M", need: { es: "Privacidad + naturaleza", en: "Privacy + nature" } },
];

export type MatchedBuyer = {
  id: string;
  who: Localized;
  match: number;
  budget: string;
  budgetMid: number;
  wants: Localized;
  timeline: Localized;
  services: Localized[];
};

export const demoProject = { name: "Bayfront Residences", hood: "Brickell", developer: "Aurora Sky Development" };

export const matchedBuyers: MatchedBuyer[] = [
  {
    id: "b1",
    who: { es: "Familia · São Paulo", en: "Family · São Paulo" },
    match: 94,
    budget: "$3–4.5M",
    budgetMid: 3_750_000,
    wants: { es: "3 dorm., vista a la bahía", en: "3 bed, bay view" },
    timeline: { es: "Compra en 6 meses", en: "Buying in 6 months" },
    services: [
      { es: "Due diligence", en: "Due diligence" },
      { es: "Interiorismo", en: "Interiors" },
      { es: "Mudanza internacional", en: "International move" },
    ],
  },
  {
    id: "b2",
    who: { es: "Fundador tech · Nueva York", en: "Tech founder · New York" },
    match: 88,
    budget: "$2.5–3.5M",
    budgetMid: 3_000_000,
    wants: { es: "2 dorm. + oficina", en: "2 bed + office" },
    timeline: { es: "Compra en 3 meses", en: "Buying in 3 months" },
    services: [
      { es: "Domótica", en: "Home automation" },
      { es: "Gestión de la residencia", en: "Residence management" },
    ],
  },
  {
    id: "b3",
    who: { es: "Inversionista · Madrid", en: "Investor · Madrid" },
    match: 81,
    budget: "$3–6M",
    budgetMid: 4_500_000,
    wants: { es: "2 unidades para renta", en: "2 units to rent out" },
    timeline: { es: "Compra en 9 meses", en: "Buying in 9 months" },
    services: [
      { es: "Gestión de renta", en: "Rental management" },
      { es: "Estructura legal y fiscal", en: "Legal and tax structure" },
    ],
  },
  {
    id: "b4",
    who: { es: "Pareja · Ciudad de México", en: "Couple · Mexico City" },
    match: 76,
    budget: "$2–3M",
    budgetMid: 2_500_000,
    wants: { es: "2 dorm., amenidades completas", en: "2 bed, full amenities" },
    timeline: { es: "Compra en 12 meses", en: "Buying in 12 months" },
    services: [
      { es: "Chófer y seguridad", en: "Driver and security" },
      { es: "Staff del hogar", en: "Household staff" },
    ],
  },
];
