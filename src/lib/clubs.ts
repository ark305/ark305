// Modo membresía: cada desarrollo crea su propio club "powered by ARK305".
// Todo es demo: clubes, tiers, precios, aliados y beneficios son ilustrativos.
import type { Localized } from "./locale";

export type AllyCategory = "restaurant" | "beach" | "marina" | "spa" | "gym" | "art";
export type BenefitKind = "discount" | "access" | "priority";

export type Ally = { id: string; name: string; category: AllyCategory; hood: string; kind: BenefitKind; benefit: Localized; minTier: number };

export type ClubTier = {
  id: string;
  name: string;
  price: number; // US$ por miembro al mes
  paidBy: "developer" | "member";
  uptake: number; // % de unidades que lo tienen (demo)
  perks: Localized[];
};

export type Club = {
  slug: string;
  name: string;
  short: string;
  developer: string;
  hood: string;
  units: number;
  avgPrice: number; // US$ millones
  colors: [string, string];
  tagline: Localized;
  tiers: ClubTier[];
  allies: Ally[];
  resident: { name: string; unit: string; tier: number };
};

export const clubs: Club[] = [
  {
    slug: "frida",
    name: "Frida Kahlo Wynwood Residences",
    short: "Club Frida",
    developer: "PMG",
    hood: "Wynwood",
    units: 400,
    avgPrice: 0.9,
    colors: ["#1F4FA8", "#E4572E"],
    tagline: { es: "Arte, color y ciudad: el club de quienes viven en Frida.", en: "Art, color and city: the club for those who live at Frida." },
    tiers: [
      {
        id: "casa-azul",
        name: "Casa Azul",
        price: 100,
        paidBy: "developer",
        uptake: 1,
        perks: [
          { es: "Incluido con tu residencia por 24 meses", en: "Included with your residence for 24 months" },
          { es: "Beneficios con todos los aliados del club", en: "Benefits with every club partner" },
          { es: "Concierge ARK por chat", en: "ARK concierge by chat" },
          { es: "Eventos de arte del edificio", en: "Building art events" },
        ],
      },
      {
        id: "coyoacan",
        name: "Coyoacán",
        price: 450,
        paidBy: "member",
        uptake: 0.15,
        perks: [
          { es: "Todo Casa Azul + reserva prioritaria", en: "All of Casa Azul + priority booking" },
          { es: "Limpieza y staff con tarifa de miembro", en: "Cleaning and staff at member rates" },
          { es: "Video y fotos de tu unidad para rentarla", en: "Video and photos of your unit to rent it" },
        ],
      },
      {
        id: "viva-la-vida",
        name: "Viva la Vida",
        price: 2500,
        paidBy: "member",
        uptake: 0.03,
        perks: [
          { es: "Concierge privado dedicado", en: "Dedicated private concierge" },
          { es: "Acceso a ARK Private y off-market", en: "Access to ARK Private and off-market" },
          { es: "Yate, chofer y chef con prioridad total", en: "Yacht, driver and chef with top priority" },
        ],
      },
    ],
    allies: [
      { id: "mesa", name: "Mesa Coyoacán", category: "restaurant", hood: "Wynwood", kind: "discount", benefit: { es: "15% en la cuenta", en: "15% off the bill" }, minTier: 0 },
      { id: "forma", name: "Forma Wynwood", category: "gym", hood: "Wynwood", kind: "access", benefit: { es: "Acceso libre + 1 clase por semana", en: "Free access + 1 class a week" }, minTier: 0 },
      { id: "taller", name: "Taller Wynwood", category: "art", hood: "Wynwood", kind: "access", benefit: { es: "Preview privado de cada exposición", en: "Private preview of every show" }, minTier: 0 },
      { id: "ritual", name: "Ritual Spa", category: "spa", hood: "Design District", kind: "discount", benefit: { es: "20% en tratamientos", en: "20% off treatments" }, minTier: 0 },
      { id: "azul", name: "Azul Beach Club", category: "beach", hood: "Miami Beach", kind: "access", benefit: { es: "Camastros sin reserva de lunes a jueves", en: "Daybeds without booking Mon–Thu" }, minTier: 1 },
      { id: "bay-marina", name: "Biscayne Bay Marina", category: "marina", hood: "Edgewater", kind: "priority", benefit: { es: "Reserva prioritaria de yate y amarre", en: "Priority yacht and slip booking" }, minTier: 1 },
    ],
    resident: { name: "Valentina R.", unit: "1204", tier: 0 },
  },
  {
    slug: "bayfront",
    name: "Bayfront Residences",
    short: "Bayfront Club",
    developer: "Aurora Sky Development",
    hood: "Brickell",
    units: 220,
    avgPrice: 3.2,
    colors: ["#3A2F1E", "#D8B170"],
    tagline: { es: "La bahía como club privado.", en: "The bay as a private club." },
    tiers: [
      { id: "bay", name: "Bay", price: 150, paidBy: "developer", uptake: 1, perks: [{ es: "Incluido por 24 meses", en: "Included for 24 months" }, { es: "Beneficios con los aliados", en: "Partner benefits" }] },
      { id: "signature", name: "Bay Signature", price: 600, paidBy: "member", uptake: 0.2, perks: [{ es: "Reserva prioritaria y staff", en: "Priority booking and staff" }] },
      { id: "founders", name: "Founders", price: 3000, paidBy: "member", uptake: 0.05, perks: [{ es: "Concierge privado y off-market", en: "Private concierge and off-market" }] },
    ],
    allies: [
      { id: "brickell-grill", name: "Bay Grill", category: "restaurant", hood: "Brickell", kind: "priority", benefit: { es: "Mesa garantizada con 2 h de aviso", en: "Guaranteed table with 2 h notice" }, minTier: 0 },
      { id: "key-spa", name: "Key Spa", category: "spa", hood: "Brickell Key", kind: "discount", benefit: { es: "15% en tratamientos", en: "15% off treatments" }, minTier: 0 },
      { id: "bay-yachts", name: "Biscayne Yacht Co", category: "marina", hood: "Brickell", kind: "priority", benefit: { es: "Prioridad en yate de 60 ft", en: "Priority on the 60 ft yacht" }, minTier: 1 },
      { id: "south-beach", name: "South Pointe Beach Club", category: "beach", hood: "Miami Beach", kind: "access", benefit: { es: "Acceso sin reserva", en: "Walk-in access" }, minTier: 1 },
    ],
    resident: { name: "Daniel K.", unit: "PH-2", tier: 1 },
  },
];

export const getClub = (slug?: string) => clubs.find((c) => c.slug === slug) ?? clubs[0];

// Economía del club (demo): lo que paga el developer y lo que genera la red al año.
export function clubEconomics(club: Club, units = club.units) {
  const included = club.tiers.find((t) => t.paidBy === "developer");
  const devCost24 = included ? units * included.price * 24 : 0;
  const perTier = club.tiers.map((t) => {
    const members = Math.round(units * t.uptake);
    return { tier: t, members, yearly: members * t.price * 12 };
  });
  const yearly = perTier.reduce((s, t) => s + t.yearly, 0);
  const sales = units * club.avgPrice * 1_000_000;
  return { devCost24, perTier, yearly, pctOfSales: (devCost24 / sales) * 100 };
}
