// Niveles de ARK305 (del prototipo: espacios Personal, Negocios y Private + ARK Pass).
// Súper Premium VIP incluye ARK Private. Precios de ejemplo: el cobro real llega en la Fase 4.
import type { Localized } from "./locale";
import type { Level } from "./mode";

export type LevelInfo = {
  id: Level;
  name: Localized;
  price: Localized;
  tagline: Localized;
  discount: number; // % de descuento en tu día (modo Buscar)
  commission: number; // % de comisión por trabajo (modo Ofrecer)
  buscar: Localized[];
  ofrecer: Localized[];
  extra?: Localized[]; // solo VIP: ARK Private
};

export const levels: LevelInfo[] = [
  {
    id: "personal",
    name: { es: "Gratis", en: "Free" },
    price: { es: "$0", en: "$0" },
    tagline: { es: "Todo lo básico para buscar, reservar y ofrecer tus servicios.", en: "Everything you need to explore, book and offer your services." },
    discount: 0,
    commission: 18,
    buscar: [
      { es: "Mi día con ARK IA", en: "My day with ARK AI" },
      { es: "Feed y perfiles de la comunidad", en: "Community feed and profiles" },
      { es: "Concierge por chat", en: "Concierge by chat" },
    ],
    ofrecer: [
      { es: "Tu perfil vitrina ark305.com/@tu-nombre", en: "Your storefront ark305.com/@you" },
      { es: "Publica servicios con precio y reserva", en: "Post services with a price and booking" },
      { es: "Comisión de 18% por trabajo", en: "18% commission per job" },
    ],
  },
  {
    id: "business",
    name: { es: "Pro", en: "Pro" },
    price: { es: "$79 / mes", en: "$79 / month" },
    tagline: { es: "Para negocios y revendedores: talento, contratos, facturas y reventa.", en: "For businesses and resellers: talent, contracts, invoices and resale." },
    discount: 10,
    commission: 12,
    buscar: [
      { es: "10% en todo tu día", en: "10% off your whole day" },
      { es: "Talento remoto con 10% por 6 meses", en: "Remote talent at 10% off for 6 months" },
      { es: "Reserva prioritaria", en: "Priority booking" },
    ],
    ofrecer: [
      { es: "Comisión de 12% en vez de 18%", en: "12% commission instead of 18%" },
      { es: "Revende paquetes con tu margen y tu marca", en: "Resell bundles with your margin and your brand" },
      { es: "Presupuestos, contratos, facturas y reportes", en: "Quotes, contracts, invoices and reports" },
      { es: "CRM y automatizaciones con GoHighLevel", en: "CRM and automations with GoHighLevel" },
      { es: "ARK IA sin límite para vender", en: "Unlimited ARK AI for selling" },
      { es: "Posición destacada en Descubrir y analítica", en: "Featured in Discover, plus analytics" },
    ],
  },
  {
    id: "vip",
    name: { es: "Súper Premium VIP", en: "Super Premium VIP" },
    price: { es: "$2,500 / mes", en: "$2,500 / month" },
    tagline: { es: "Todo lo de Pro, más ARK Private.", en: "Everything in Pro, plus ARK Private." },
    discount: 20,
    commission: 10,
    buscar: [
      { es: "20% en todo tu día", en: "20% off your whole day" },
      { es: "Concierge privado dedicado", en: "A dedicated private concierge" },
      { es: "Eventos privados y gestor de estilo de vida", en: "Private events and a lifestyle manager" },
    ],
    ofrecer: [
      { es: "Comisión de 10%", en: "10% commission" },
      { es: "Gerente de cuenta y reemplazo de talento en 72 h", en: "Account manager and talent replacement within 72 h" },
    ],
    extra: [
      { es: "Preconstrucción y off-market antes del mercado", en: "Pre-construction and off-market before the market" },
      { es: "Obra, arquitectura e interiorismo de autor", en: "Construction, architecture and signature interiors" },
      { es: "Aviación privada, megayates, seguridad y staff", en: "Private aviation, superyachts, security and staff" },
      { es: "Perfil oculto y trato confidencial", en: "Hidden profile and confidential service" },
    ],
  },
];

export function getLevel(id: Level) {
  return levels.find((l) => l.id === id)!;
}
