// Comunidad: Academia, Equipos, Grupos y Eventos (contenido del prototipo anterior).
import type { Localized } from "./locale";
import { photo } from "./mock-data";

export type Course = { id: string; name: Localized; lessons: number; license?: Localized; required?: boolean; color: string; done?: boolean };

export const courses: Course[] = [
  { id: "provider", name: { es: "Proveedor ARK", en: "ARK Provider" }, lessons: 2, required: true, color: "#D8B170", done: true },
  { id: "photo", name: { es: "Foto y video", en: "Photo & video" }, lessons: 2, color: "#EA9272", done: true },
  { id: "drone", name: { es: "Drone", en: "Drone" }, lessons: 2, license: { es: "FAA Part 107", en: "FAA Part 107" }, color: "#6FA8C9" },
  { id: "reels", name: { es: "Reels", en: "Reels" }, lessons: 2, color: "#E07A8F" },
  { id: "ugc", name: { es: "UGC", en: "UGC" }, lessons: 2, color: "#C49BD0" },
  { id: "chef", name: { es: "Chef privado", en: "Private chef" }, lessons: 2, license: { es: "Certificado de manipulación de alimentos", en: "Food handler certificate" }, color: "#9FC08A" },
  { id: "nautical", name: { es: "Seguridad náutica", en: "Nautical safety" }, lessons: 2, license: { es: "Licencia de la Guardia Costera", en: "US Coast Guard license" }, color: "#7FC2B7" },
  { id: "cm", name: { es: "Community manager", en: "Community manager" }, lessons: 2, color: "#8FB0D0" },
  { id: "crm", name: { es: "CRM", en: "CRM" }, lessons: 2, color: "#D3A468" },
  { id: "concierge", name: { es: "Concierge", en: "Concierge" }, lessons: 2, color: "#B7A58A" },
];

export type Team = { id: string; name: Localized; desc: Localized; roles: { name: Localized; hours: number; rate: number }[]; color: string };

// Equipos remotos armados (horas por semana; costo mensual = tarifa × horas × 4.33).
export const teams: Team[] = [
  {
    id: "content",
    name: { es: "Equipo de contenido", en: "Content team" },
    desc: { es: "Reels, redes y diseño para tu marca.", en: "Reels, socials and design for your brand." },
    roles: [
      { name: { es: "Editor de reels", en: "Reels editor" }, hours: 20, rate: 22 },
      { name: { es: "Community manager", en: "Community manager" }, hours: 20, rate: 18 },
      { name: { es: "Diseñador gráfico", en: "Graphic designer" }, hours: 10, rate: 25 },
    ],
    color: "#E07A8F",
  },
  {
    id: "sales",
    name: { es: "Equipo de ventas", en: "Sales team" },
    desc: { es: "Citas, cierres y seguimiento en tu CRM.", en: "Appointments, closing and CRM follow-up." },
    roles: [
      { name: { es: "Setter de citas", en: "Appointment setter" }, hours: 40, rate: 15 },
      { name: { es: "Closer de ventas", en: "Sales closer" }, hours: 20, rate: 30 },
      { name: { es: "Especialista CRM", en: "CRM specialist" }, hours: 10, rate: 35 },
    ],
    color: "#8FB0D0",
  },
  {
    id: "backoffice",
    name: { es: "Back office", en: "Back office" },
    desc: { es: "Asistencia, contabilidad y facturación.", en: "Assistance, bookkeeping and invoicing." },
    roles: [
      { name: { es: "Asistente virtual", en: "Virtual assistant" }, hours: 40, rate: 12 },
      { name: { es: "Contador", en: "Accountant" }, hours: 10, rate: 40 },
    ],
    color: "#9FC08A",
  },
];

export function teamMonthly(t: Team) {
  return Math.round(t.roles.reduce((sum, r) => sum + r.rate * r.hours * 4.33, 0));
}

// Paquete entre proveedores: se cobra una vez y ARK reparte.
export const bundle = {
  name: { es: "Día en el agua con contenido", en: "Day on the water with content" },
  members: [
    { handle: "bluewater", share: 60 },
    { handle: "lente305", share: 25 },
    { handle: "clipkitchen", share: 15 },
  ],
  price: 3200,
};

export type Group = { id: string; name: Localized; desc: Localized; members: number; tag: string; photo: string };

export const groups: Group[] = [
  { id: "yachts", name: { es: "Yates y marinas", en: "Yachts & marinas" }, desc: { es: "Salidas, rutas y consejos para el agua.", en: "Trips, routes and tips for the water." }, members: 1840, tag: "#yates", photo: photo("photo-1611042420087-4b643283fd5d") },
  { id: "creators", name: { es: "Creadores Miami", en: "Miami Creators" }, desc: { es: "Videógrafos, UGC y editores que colaboran.", en: "Videographers, UGC and editors who collaborate." }, members: 3260, tag: "#creadores", photo: photo("photo-1632187981988-40f3cbaeef5e") },
  { id: "hosts", name: { es: "Hosts de Airbnb", en: "Airbnb Hosts" }, desc: { es: "Recambios, fotos y operación de alquileres.", en: "Turnovers, photos and rental operations." }, members: 920, tag: "#hostsairbnb", photo: photo("photo-1613490493576-7fde63acd811") },
  { id: "foodies", name: { es: "Foodies 305", en: "Foodies 305" }, desc: { es: "Dónde comer y qué pedir esta semana.", en: "Where to eat and what to order this week." }, members: 2710, tag: "#foodies305", photo: photo("photo-1414235077428-338989a2e8c0") },
  { id: "home", name: { es: "Hogar 305", en: "Home 305" }, desc: { es: "Remodelación, arreglos y contratistas recomendados.", en: "Remodeling, repairs and recommended contractors." }, members: 1130, tag: "#hogar305", photo: photo("photo-1682888813913-e13f18692019") },
];

export type Event = { id: string; name: Localized; when: Localized; place: string; photo: string; going: number };

export const events: Event[] = [
  { id: "sail", name: { es: "Sunset Sail Social", en: "Sunset Sail Social" }, when: { es: "Jueves · 6:00 p. m.", en: "Thursday · 6:00 PM" }, place: "Miami Beach Marina", photo: photo("photo-1605387202149-47169c4ea58a"), going: 48 },
  { id: "brunch", name: { es: "Brunch de creadores", en: "Creators' brunch" }, when: { es: "Sábado · 11:00 a. m.", en: "Saturday · 11:00 AM" }, place: "Wynwood", photo: photo("photo-1740047602722-b4993b79e4b7"), going: 86 },
  { id: "night", name: { es: "Noche Brickell", en: "Brickell Night" }, when: { es: "Lunes · 10:00 p. m.", en: "Monday · 10:00 PM" }, place: "Brickell", photo: photo("photo-1506869640319-fe1a24fd76dc"), going: 132 },
];
