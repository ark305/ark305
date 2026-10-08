// ARK Private (incluido en Súper Premium VIP). Datos de demostración del prototipo:
// precios, entregas y amenidades son ficticios.
import type { Localized } from "./locale";
import { photo } from "./mock-data";

export const INVITE_CODE = "ARKPRIVATE"; // código de prueba, como en el prototipo

export type Residence = { id: string; name: string; developer: string; hood: string; from: string; delivery: number; beds: Localized; photo: string };

// Ficha de cada residencia (prototipo ark305-app): precio base, tamaño, HOA por ft² al mes,
// amenidades y plan de pagos por etapa (% del precio).
export type ResidenceDetail = { price: number; size: string; hoa: number; amenities: Localized[]; plan: { stage: Localized; pct: number }[] };

const L = (es: string, en: string): Localized => ({ es, en });
const RESERVA = L("Reserva", "Reservation");
const CONTRATO = L("Contrato", "Contract");
const ENTREGA = L("Entrega", "Delivery");

export const residenceDetails: Record<string, ResidenceDetail> = {
  r1: { price: 3_200_000, size: "1,450 – 4,800 ft²", hoa: 1.35, amenities: [L("Piscina en el piso 60", "Pool on floor 60"), L("Spa y sauna", "Spa and sauna"), L("Restaurante privado", "Private restaurant"), L("Marina", "Marina"), L("Gimnasio de 12,000 ft²", "12,000 ft² gym")], plan: [{ stage: RESERVA, pct: 10 }, { stage: CONTRATO, pct: 10 }, { stage: L("Piso 20", "Floor 20"), pct: 10 }, { stage: ENTREGA, pct: 70 }] },
  r2: { price: 1_950_000, size: "980 – 3,600 ft²", hoa: 1.15, amenities: [L("Terraza con piscina", "Terrace with pool"), L("Coworking", "Coworking"), L("Cine", "Cinema"), L("Muelle para tenders", "Tender dock")], plan: [{ stage: RESERVA, pct: 10 }, { stage: CONTRATO, pct: 15 }, { stage: L("Obra gris", "Shell construction"), pct: 10 }, { stage: ENTREGA, pct: 65 }] },
  r3: { price: 7_500_000, size: "3,100 – 9,200 ft²", hoa: 1.9, amenities: [L("Playa privada", "Private beach"), L("Club náutico", "Yacht club"), L("Spa de 8,000 ft²", "8,000 ft² spa"), L("Helipuerto", "Helipad")], plan: [{ stage: RESERVA, pct: 10 }, { stage: CONTRATO, pct: 10 }, { stage: L("Estructura", "Structure"), pct: 10 }, { stage: ENTREGA, pct: 70 }] },
  r4: { price: 2_400_000, size: "1,600 – 4,100 ft²", hoa: 1.1, amenities: [L("Jardín interior", "Interior garden"), L("Wine room", "Wine room"), L("Servicio de conserjería", "Concierge service"), L("Galería de arte", "Art gallery")], plan: [{ stage: RESERVA, pct: 10 }, { stage: CONTRATO, pct: 10 }, { stage: L("Techo", "Roof"), pct: 10 }, { stage: ENTREGA, pct: 70 }] },
  r5: { price: 12_000_000, size: "6,800 – 11,500 ft²", hoa: 0, amenities: [L("Muelle privado", "Private dock"), L("Piscina infinita", "Infinity pool"), L("Spa", "Spa"), L("Casa de huéspedes", "Guest house"), L("Domótica integral", "Full home automation")], plan: [{ stage: RESERVA, pct: 10 }, { stage: CONTRATO, pct: 20 }, { stage: L("Estructura", "Structure"), pct: 10 }, { stage: ENTREGA, pct: 60 }] },
  r6: { price: 4_100_000, size: "2,900 – 6,300 ft²", hoa: 1.4, amenities: [L("Bosque privado", "Private forest"), L("Piscina", "Pool"), L("Gimnasio", "Gym"), L("Muelle compartido", "Shared dock")], plan: [{ stage: RESERVA, pct: 10 }, { stage: CONTRATO, pct: 10 }, { stage: L("Cubierta", "Deck"), pct: 10 }, { stage: ENTREGA, pct: 70 }] },
};

// $3.2M, $1.95M, $320K
export function shortUSD(n: number) {
  if (n >= 1_000_000) return `$${Number((n / 1_000_000).toFixed(2))}M`;
  return `$${Math.round(n / 1000)}K`;
}

export const residences: Residence[] = [
  { id: "r1", name: "Bayfront Residences", developer: "Aurora Sky Development", hood: "Brickell", from: "$3.2M", delivery: 2028, beds: { es: "2 a 5 dorm.", en: "2–5 bed" }, photo: photo("photo-1589159812824-9d955325fe94") },
  { id: "r3", name: "Cielo Key", developer: "Aurora Sky Development", hood: "Key Biscayne", from: "$7.5M", delivery: 2029, beds: { es: "3 a 6 dorm.", en: "3–6 bed" }, photo: photo("photo-1774423864869-702b21c2490a") },
  { id: "r5", name: "Sunset Isles Villas", developer: "Hierro & Cal", hood: "Miami Beach", from: "$12M", delivery: 2028, beds: { es: "5 a 7 dorm.", en: "5–7 bed" }, photo: photo("photo-1613490493576-7fde63acd811") },
  { id: "r2", name: "Aurora Sky", developer: "Aurora Sky Development", hood: "Edgewater", from: "$1.95M", delivery: 2027, beds: { es: "1 a 4 dorm.", en: "1–4 bed" }, photo: photo("photo-1672866481772-a3e4a922ce4f") },
  { id: "r4", name: "Coral Atelier", developer: "Aurora Sky Development", hood: "Coral Gables", from: "$2.4M", delivery: 2027, beds: { es: "2 a 4 dorm.", en: "2–4 bed" }, photo: photo("photo-1779903726785-7cf25bed78f7") },
  { id: "r6", name: "Mangrove House", developer: "Hierro & Cal", hood: "Coconut Grove", from: "$4.1M", delivery: 2029, beds: { es: "3 a 5 dorm.", en: "3–5 bed" }, photo: photo("photo-1580587771525-78b9dba3b914") },
];

export type PrivateService = { name: Localized; desc: Localized; price: Localized | null };
export type PrivateGroup = { title: Localized; items: PrivateService[] };

const quote = null; // "A cotizar"

export const privateServices: PrivateGroup[] = [
  {
    title: { es: "Preconstrucción y patrimonio", en: "Pre-construction & real estate" },
    items: [
      { name: { es: "Acceso a preconstrucción", en: "Pre-construction access" }, desc: { es: "Reserva de línea en lanzamientos antes del mercado.", en: "Reserve a line at launches before the market." }, price: quote },
      { name: { es: "Reventa y off-market", en: "Resale & off-market" }, desc: { es: "Residencias que no se publican en el MLS.", en: "Residences that never hit the MLS." }, price: quote },
      { name: { es: "Due diligence de compra", en: "Purchase due diligence" }, desc: { es: "Revisión legal, financiera y estructural antes de firmar.", en: "Legal, financial and structural review before signing." }, price: { es: "$4,500 fijo", en: "$4,500 flat" } },
      { name: { es: "Gestión de la residencia", en: "Residence management" }, desc: { es: "Mantenimiento, staff y proveedores bajo un solo responsable.", en: "Maintenance, staff and vendors under one manager." }, price: { es: "$1,900 / mes", en: "$1,900 / month" } },
    ],
  },
  {
    title: { es: "Obra y diseño", en: "Construction & design" },
    items: [
      { name: { es: "Contratista general de lujo", en: "Luxury general contractor" }, desc: { es: "Obra nueva y remodelación integral.", en: "New builds and full remodels." }, price: quote },
      { name: { es: "Gerencia de proyecto", en: "Project management" }, desc: { es: "Un gerente que responde por tiempo, costo y calidad.", en: "One manager accountable for time, cost and quality." }, price: { es: "$9,500 / mes", en: "$9,500 / month" } },
      { name: { es: "Interiorismo de autor", en: "Signature interiors" }, desc: { es: "Diseño integral con piezas a medida.", en: "Full design with bespoke pieces." }, price: quote },
      { name: { es: "Domótica y audio integral", en: "Home automation & audio" }, desc: { es: "Luz, clima, audio, video y cortinas.", en: "Light, climate, audio, video and shades." }, price: quote },
    ],
  },
  {
    title: { es: "Vida privada", en: "Private life" },
    items: [
      { name: { es: "Aviación privada", en: "Private aviation" }, desc: { es: "Chárter de jet o helicóptero con tripulación.", en: "Jet or helicopter charter with crew." }, price: quote },
      { name: { es: "Megayate 100 ft+", en: "100 ft+ superyacht" }, desc: { es: "Charter con capitán, tripulación y chef.", en: "Charter with captain, crew and chef." }, price: quote },
      { name: { es: "Seguridad residencial y ejecutiva", en: "Residential & executive security" }, desc: { es: "Escolta, monitoreo y protocolo familiar.", en: "Escort, monitoring and family protocol." }, price: { es: "$8,500 / mes", en: "$8,500 / month" } },
      { name: { es: "Staff doméstico", en: "Household staff" }, desc: { es: "Mayordomo, ama de llaves, niñera y chofer.", en: "Butler, housekeeper, nanny and driver." }, price: { es: "$6,500 / mes", en: "$6,500 / month" } },
      { name: { es: "Relocation y colegios", en: "Relocation & schools" }, desc: { es: "Mudanza internacional, colegios y trámites.", en: "International moving, schools and paperwork." }, price: quote },
    ],
  },
];
