// ARK Private (incluido en Súper Premium VIP). Datos de demostración del prototipo:
// precios, entregas y amenidades son ficticios.
import type { Localized } from "./locale";
import { photo } from "./mock-data";

export const INVITE_CODE = "ARKPRIVATE"; // código de prueba, como en el prototipo

export type Residence = { id: string; name: string; developer: string; hood: string; from: string; delivery: number; beds: Localized; photo: string };

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
    ],
  },
];
