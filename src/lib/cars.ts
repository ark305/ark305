// ARK CARS: club de autos por membresía. Flota y planes de ejemplo del prototipo
// (ark305-app). Sin marcas reales: se reemplaza por la flota del operador.
import type { Localized } from "./locale";

export type CarCat = "sport" | "super" | "suv" | "gt" | "conv" | "ev";

export type Car = {
  id: string;
  name: Localized;
  desc: Localized;
  cat: CarCat;
  hp: number;
  seats: number;
  credits: number; // créditos por día
  cash: number; // dólares por día sin membresía
  color: Localized;
  hex: string; // color de la carrocería en el dibujo
  miles: number; // millas incluidas por día
  founders?: boolean; // solo miembros Founders
};

export const carCats: { id: CarCat | "all"; name: Localized; short: Localized }[] = [
  { id: "all", name: { es: "Toda", en: "All" }, short: { es: "Toda", en: "All" } },
  { id: "sport", name: { es: "Deportivo", en: "Sports car" }, short: { es: "Deportivo", en: "Sports" } },
  { id: "super", name: { es: "Superdeportivo", en: "Supercar" }, short: { es: "Superdeportivo", en: "Supercar" } },
  { id: "suv", name: { es: "SUV de lujo", en: "Luxury SUV" }, short: { es: "SUV", en: "SUV" } },
  { id: "gt", name: { es: "Gran turismo", en: "Grand tourer" }, short: { es: "GT", en: "GT" } },
  { id: "conv", name: { es: "Descapotable", en: "Convertible" }, short: { es: "Descapotable", en: "Convertible" } },
  { id: "ev", name: { es: "Eléctrico", en: "Electric" }, short: { es: "Eléctrico", en: "Electric" } },
];

export const cars: Car[] = [
  { id: "c1", cat: "conv", hp: 503, seats: 4, credits: 2, cash: 750, miles: 150, hex: "#C8CDD3", name: { es: "V8 alemán descapotable", en: "German V8 convertible" }, desc: { es: "Cabrio de 4 plazas, ideal para Ocean Drive al atardecer.", en: "4-seat convertible, ideal for Ocean Drive at sunset." }, color: { es: "Plata líquido", en: "Liquid silver" } },
  { id: "c2", cat: "suv", hp: 523, seats: 5, credits: 2, cash: 790, miles: 150, hex: "#2F4A3C", name: { es: "SUV británico de lujo", en: "British luxury SUV" }, desc: { es: "Cuero, silencio y maletero real. Perfecto para llegadas.", en: "Leather, silence and a real trunk. Perfect for arrivals." }, color: { es: "Verde inglés", en: "British racing green" } },
  { id: "c3", cat: "super", hp: 631, seats: 2, credits: 5, cash: 2400, miles: 100, hex: "#E8742A", name: { es: "Superdeportivo italiano V10", en: "Italian V10 supercar" }, desc: { es: "Tracción integral, escape de fábrica, modo Corsa.", en: "All-wheel drive, factory exhaust, Corsa mode." }, color: { es: "Naranja", en: "Orange" } },
  { id: "c4", cat: "super", hp: 770, seats: 2, credits: 7, cash: 3500, miles: 80, hex: "#1D1D20", name: { es: "Superdeportivo V12 biturbo", en: "V12 twin-turbo supercar" }, desc: { es: "Para quien ya manejó todo lo demás.", en: "For those who've already driven everything else." }, color: { es: "Negro mate", en: "Matte black" } },
  { id: "c5", cat: "gt", hp: 612, seats: 4, credits: 4, cash: 1900, miles: 150, hex: "#1F3A66", name: { es: "GT italiano 2+2", en: "Italian 2+2 GT" }, desc: { es: "Gran turismo para Keys o Palm Beach.", en: "Grand tourer for the Keys or Palm Beach." }, color: { es: "Azul noche", en: "Midnight blue" } },
  { id: "c6", cat: "sport", hp: 443, seats: 4, credits: 3, cash: 1100, miles: 150, hex: "#E9E7E2", name: { es: "Deportivo alemán 911", en: "German sports car 911" }, desc: { es: "El clásico que nunca se equivoca.", en: "The classic that never gets it wrong." }, color: { es: "Blanco", en: "White" } },
  { id: "c7", cat: "suv", hp: 641, seats: 5, credits: 4, cash: 1600, miles: 120, hex: "#4A4E54", name: { es: "SUV italiano de altas prestaciones", en: "High-performance Italian SUV" }, desc: { es: "Familia y adrenalina en el mismo auto.", en: "Family and adrenaline in the same car." }, color: { es: "Gris grafito", en: "Graphite gray" } },
  { id: "c8", cat: "ev", hp: 750, seats: 5, credits: 2, cash: 690, miles: 250, hex: "#F1EFE9", name: { es: "Sedán eléctrico de lujo", en: "Luxury electric sedan" }, desc: { es: "Silencioso, con carga incluida en la entrega.", en: "Silent, with charging included at delivery." }, color: { es: "Blanco perla", en: "Pearl white" } },
  { id: "c9", cat: "ev", hp: 660, seats: 7, credits: 2, cash: 720, miles: 250, hex: "#141416", name: { es: "SUV eléctrico premium", en: "Premium electric SUV" }, desc: { es: "Tres filas, para grupo o familia.", en: "Three rows, for groups or families." }, color: { es: "Negro", en: "Black" } },
  { id: "c10", cat: "conv", hp: 528, seats: 2, credits: 3, cash: 1250, miles: 120, hex: "#20372B", name: { es: "Roadster británico V8", en: "British V8 roadster" }, desc: { es: "Elegancia clásica con techo abierto.", en: "Classic elegance with an open top." }, color: { es: "Verde oscuro", en: "Dark green" } },
  { id: "c11", cat: "suv", hp: 577, seats: 5, credits: 5, cash: 2100, miles: 100, hex: "#141416", name: { es: "Todoterreno de lujo blindado", en: "Armored luxury off-roader" }, desc: { es: "Nivel de protección B4, con chofer opcional.", en: "Protection level B4, optional chauffeur." }, color: { es: "Negro", en: "Black" } },
  { id: "c12", cat: "super", hp: 1000, seats: 2, credits: 10, cash: 5500, miles: 60, hex: "#C1202A", founders: true, name: { es: "Hiperdeportivo híbrido", en: "Hybrid hypercar" }, desc: { es: "Reserva con 7 días de anticipación. Solo miembros Founders.", en: "Book 7 days in advance. Founders members only." }, color: { es: "Rojo", en: "Red" } },
];

export type TierId = "club" | "prestige" | "elite" | "founders";
export type Tier = { id: TierId; name: string; price: number; credits: number; max: number; perks: Localized[] };

// max = el auto más caro (en créditos por día) que cubre el plan.
export const tiers: Tier[] = [
  {
    id: "club", name: "Club", price: 2900, credits: 8, max: 3,
    perks: [
      { es: "8 créditos al mes", en: "8 credits per month" },
      { es: "Hasta categoría deportivo", en: "Up to sports car category" },
      { es: "Entrega en Miami-Dade", en: "Delivery in Miami-Dade" },
      { es: "Seguro y mantenimiento incluidos", en: "Insurance and maintenance included" },
    ],
  },
  {
    id: "prestige", name: "Prestige", price: 5900, credits: 18, max: 5,
    perks: [
      { es: "18 créditos al mes", en: "18 credits per month" },
      { es: "Superdeportivos incluidos", en: "Supercars included" },
      { es: "Entrega en Miami y Broward", en: "Delivery in Miami and Broward" },
      { es: "2 invitados autorizados", en: "2 authorized guests" },
    ],
  },
  {
    id: "elite", name: "Elite", price: 12500, credits: 40, max: 7,
    perks: [
      { es: "40 créditos al mes", en: "40 credits per month" },
      { es: "Toda la flota estándar", en: "The entire standard fleet" },
      { es: "Entrega en 90 minutos", en: "Delivered in 90 minutes" },
      { es: "Chofer 4 días al mes", en: "Chauffeur 4 days a month" },
      { es: "Traslado al aeropuerto privado", en: "Private airport transfer" },
    ],
  },
  {
    id: "founders", name: "Founders", price: 25000, credits: 90, max: 10,
    perks: [
      { es: "90 créditos al mes", en: "90 credits per month" },
      { es: "Incluye hiperdeportivos", en: "Includes hypercars" },
      { es: "Reserva garantizada en 24 h", en: "Guaranteed booking within 24 h" },
      { es: "Auto guardado en su edificio", en: "Car kept at your building" },
      { es: "Acceso a eventos de marca", en: "Access to brand events" },
    ],
  },
];

export const getCar = (id: string) => cars.find((c) => c.id === id);
export const getTier = (id: TierId | null) => tiers.find((t) => t.id === id) ?? null;

// ¿El plan cubre este auto? Los Founders solo con plan Founders.
export function carAllowed(car: Car, tier: Tier | null) {
  if (!tier) return false;
  if (car.founders && tier.id !== "founders") return false;
  return car.credits <= tier.max;
}

// Días de la reserva, contando el primero y el último ("2026-10-10" a "2026-10-11" = 2 días).
export function carDays(from: string, to: string) {
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}
