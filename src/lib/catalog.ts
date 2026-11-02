// Catálogo de servicios, días armados y el planificador de "Mi día".
// Precios del prototipo anterior. El planificador es la vista previa de ARK IA:
// entiende palabras clave. La integración futura con Meta conservará el formato de respuesta.
import type { Locale, Localized } from "./locale";
import { photo } from "./mock-data";

export type Unit = "h" | "p" | "f" | "m"; // por hora, por persona, fija, mensual

export type CatalogItem = {
  id: string;
  name: Localized;
  desc: Localized;
  price: number;
  unit: Unit;
  hours?: number[]; // opciones de horas cuando es por hora
  provider: string; // handle
  photo: string;
  outing: boolean; // salidas que necesitan chofer
};

export const catalog: CatalogItem[] = [
  { id: "suv", name: { es: "SUV con chofer", en: "SUV with driver" }, desc: { es: "Escalade o similar, chofer bilingüe.", en: "Escalade or similar, bilingual driver." }, price: 125, unit: "h", hours: [2, 3, 4, 6], provider: "miamiblackcar", photo: photo("photo-1735620731955-b047a7122892"), outing: false },
  { id: "airport", name: { es: "Traslado aeropuerto", en: "Airport transfer" }, desc: { es: "MIA o FLL, con recepción en llegadas.", en: "MIA or FLL, with meet & greet." }, price: 180, unit: "f", provider: "miamiblackcar", photo: photo("photo-1767749995450-7b63ab7cd4fd"), outing: false },
  { id: "heli", name: { es: "Helicóptero", en: "Helicopter" }, desc: { es: "Tour por South Beach o traslado a los Keys.", en: "South Beach tour or a transfer to the Keys." }, price: 1400, unit: "h", hours: [1, 2], provider: "skyview", photo: photo("photo-1623060528744-59fb89bdc84c"), outing: true },
  { id: "yacht", name: { es: "Yate 50 ft", en: "50 ft yacht" }, desc: { es: "Sandbar, Star Island y Biscayne Bay.", en: "Sandbar, Star Island and Biscayne Bay." }, price: 700, unit: "h", hours: [4, 6, 8], provider: "bluewater", photo: photo("photo-1541945876617-8026869043f2"), outing: true },
  { id: "catamaran", name: { es: "Catamarán al atardecer", en: "Sunset catamaran" }, desc: { es: "Navegación tranquila, perfecta para parejas.", en: "A calm sail, perfect for couples." }, price: 420, unit: "h", hours: [2, 3, 4], provider: "sunsetcharters", photo: photo("photo-1605387202149-47169c4ea58a"), outing: true },
  { id: "jetski", name: { es: "Jet ski", en: "Jet ski" }, desc: { es: "Salida desde Miami Beach Marina.", en: "Departs from Miami Beach Marina." }, price: 150, unit: "h", hours: [1, 2], provider: "bluewater", photo: photo("photo-1554132267-d06483b00adc"), outing: true },
  { id: "chef", name: { es: "Chef privado", en: "Private chef" }, desc: { es: "Menú de 4 tiempos en tu casa o a bordo.", en: "A 4-course menu at home or on board." }, price: 125, unit: "p", provider: "chefadri", photo: photo("photo-1577219491135-ce391730fb2c"), outing: false },
  { id: "brunch", name: { es: "Brunch a domicilio", en: "Brunch at home" }, desc: { es: "Montaje completo para grupo.", en: "Full setup for your group." }, price: 65, unit: "p", provider: "mesa305", photo: photo("photo-1740047602722-b4993b79e4b7"), outing: false },
  { id: "bottles", name: { es: "Delivery de botellas", en: "Bottle delivery" }, desc: { es: "Champagne, tequila y hielo al yate o la villa.", en: "Champagne, tequila and ice to the yacht or villa." }, price: 95, unit: "f", provider: "noches305", photo: photo("photo-1680080340085-ab0f02bbb308"), outing: false },
  { id: "restaurant", name: { es: "Mesa en restaurante", en: "Restaurant table" }, desc: { es: "Reserva en lugares difíciles de conseguir.", en: "Bookings at hard-to-get spots." }, price: 75, unit: "f", provider: "noches305", photo: photo("photo-1414235077428-338989a2e8c0"), outing: true },
  { id: "vipTable", name: { es: "Mesa VIP en club", en: "VIP club table" }, desc: { es: "Acceso y mesa con host.", en: "Entry and a table with a host." }, price: 250, unit: "f", provider: "noches305", photo: photo("photo-1496337589254-7e19d01cec44"), outing: true },
  { id: "turnover", name: { es: "Recambio Airbnb", en: "Airbnb turnover" }, desc: { es: "Limpieza, ropa de cama y reporte con fotos.", en: "Cleaning, linens and a photo report." }, price: 145, unit: "f", provider: "casalimpia", photo: photo("photo-1680416124510-5eae1beca412"), outing: false },
  { id: "villa", name: { es: "Preparar la villa", en: "Villa prep" }, desc: { es: "Flores, compras y ambiente antes de llegar.", en: "Flowers, groceries and ambiance before you arrive." }, price: 220, unit: "f", provider: "casalimpia", photo: photo("photo-1613490493576-7fde63acd811"), outing: false },
  { id: "photographer", name: { es: "Fotógrafo", en: "Photographer" }, desc: { es: "Sesión en yate, calle o evento.", en: "A shoot on a yacht, street or event." }, price: 350, unit: "h", hours: [1, 2, 3], provider: "lente305", photo: photo("photo-1763400681783-9657ab2d5a46"), outing: false },
  { id: "drone", name: { es: "Video con drone", en: "Drone video" }, desc: { es: "Tomas aéreas con piloto licenciado.", en: "Aerial shots with a licensed pilot." }, price: 480, unit: "h", hours: [1, 2], provider: "aeroframe", photo: photo("photo-1506947411487-a56738267384"), outing: false },
  { id: "reel", name: { es: "Reel para redes", en: "Social reel" }, desc: { es: "Grabación y edición de un reel vertical.", en: "Filming and editing of a vertical reel." }, price: 650, unit: "f", provider: "danielm", photo: photo("photo-1763736808904-ea253061553e"), outing: false },
  { id: "shoot", name: { es: "Grabación ClipKitchen", en: "ClipKitchen shoot" }, desc: { es: "Sesión presencial, material sin editar.", en: "In-person session, raw footage." }, price: 500, unit: "h", hours: [1, 2, 3], provider: "clipkitchen", photo: photo("photo-1579109652910-99b9be06aaec"), outing: false },
  { id: "edit30", name: { es: "Edición: 30 videos", en: "Editing: 30 videos" }, desc: { es: "Un mes de contenido a partir de tu material.", en: "A month of content from your footage." }, price: 900, unit: "m", provider: "camila.edita", photo: photo("photo-1502209877429-d7c6df9eb3f9"), outing: false },
];

export function getItem(id: string) {
  return catalog.find((c) => c.id === id);
}

export type DayEntry = { uid: string; id: string; time: string; qty: number; guests: number };

export function entryPrice(e: DayEntry) {
  const c = getItem(e.id);
  if (!c) return 0;
  if (c.unit === "h") return c.price * e.qty;
  if (c.unit === "p") return c.price * e.guests;
  return c.price;
}

// ---------- Días armados (paquetes listos) ----------

export type Package = { id: string; name: Localized; desc: Localized; photo: string; items: { id: string; time: string; qty: number }[] };

export const packages: Package[] = [
  {
    id: "water",
    name: { es: "Día en el agua", en: "Day on the water" },
    desc: { es: "Chofer, yate 6 h, chef a bordo y fotógrafo.", en: "Driver, 6 h yacht, chef on board and photographer." },
    photo: photo("photo-1611042420087-4b643283fd5d"),
    items: [{ id: "suv", time: "10:00", qty: 2 }, { id: "yacht", time: "11:00", qty: 6 }, { id: "chef", time: "13:00", qty: 1 }, { id: "photographer", time: "15:00", qty: 2 }],
  },
  {
    id: "night",
    name: { es: "Noche en Miami", en: "Miami night" },
    desc: { es: "SUV, cena reservada, mesa VIP y botellas.", en: "SUV, dinner booked, VIP table and bottles." },
    photo: photo("photo-1578736641330-3155e606cd40"),
    items: [{ id: "suv", time: "19:00", qty: 6 }, { id: "restaurant", time: "20:00", qty: 1 }, { id: "vipTable", time: "23:00", qty: 1 }, { id: "bottles", time: "23:30", qty: 1 }],
  },
  {
    id: "sky",
    name: { es: "Desde el aire", en: "From above" },
    desc: { es: "Helicóptero sobre South Beach y video con drone.", en: "Helicopter over South Beach and drone video." },
    photo: photo("photo-1623060528744-59fb89bdc84c"),
    items: [{ id: "suv", time: "09:30", qty: 2 }, { id: "heli", time: "10:30", qty: 1 }, { id: "drone", time: "12:00", qty: 1 }],
  },
  {
    id: "host",
    name: { es: "Host de Airbnb", en: "Airbnb host" },
    desc: { es: "Recambio, villa lista y fotos del inmueble.", en: "Turnover, villa ready and listing photos." },
    photo: photo("photo-1613490493576-7fde63acd811"),
    items: [{ id: "turnover", time: "11:00", qty: 1 }, { id: "villa", time: "14:00", qty: 1 }, { id: "photographer", time: "16:30", qty: 1 }],
  },
];

// ---------- ARK IA · planificador (vista previa) ----------

const RULES: { id: string; words: string[]; time: string; qty?: number }[] = [
  { id: "airport", words: ["aeropuerto", "airport", "vuelo", "flight", "llego", "arrive"], time: "09:00" },
  { id: "heli", words: ["helicoptero", "helicopter", "desde el aire", "from above", "aereo"], time: "10:30", qty: 1 },
  { id: "jetski", words: ["jet ski", "jetski", "moto de agua"], time: "10:00", qty: 1 },
  { id: "yacht", words: ["yate", "barco", "agua", "sandbar", "yacht", "boat", "water", "navegar"], time: "11:00", qty: 4 },
  { id: "brunch", words: ["brunch", "desayuno", "breakfast"], time: "11:00" },
  { id: "drone", words: ["drone", "dron"], time: "12:00", qty: 1 },
  { id: "reel", words: ["reel", "tiktok"], time: "13:00" },
  { id: "photographer", words: ["foto", "fotos", "grabe", "grabar", "instagram", "photo", "pictures", "film", "video"], time: "15:00", qty: 2 },
  { id: "catamaran", words: ["atardecer", "catamaran", "sunset", "pareja", "couple"], time: "18:00", qty: 2 },
  { id: "chef", words: ["chef", "cena en casa", "cenar en casa", "dinner at home", "comida", "cena", "dinner"], time: "19:00" },
  { id: "restaurant", words: ["restaurante", "restaurant", "omakase"], time: "20:30" },
  { id: "vipTable", words: ["club", "fiesta", "noche", "discoteca", "party", "night", "rumba"], time: "23:00" },
  { id: "bottles", words: ["botella", "champagne", "tequila", "bottle"], time: "23:30" },
  { id: "turnover", words: ["airbnb", "recambio", "huesped", "turnover", "guests arrive"], time: "11:00" },
  { id: "villa", words: ["villa", "preparar la casa", "prep the house"], time: "14:00" },
  { id: "suv", words: ["chofer", "driver", "transporte", "suv", "carro"], time: "10:00", qty: 2 },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const toTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export type Plan = { items: Omit<DayEntry, "uid">[]; guests: number; understood: boolean };

export function planDay(prompt: string, fallbackGuests = 4): Plan {
  const text = ` ${norm(prompt)} `;
  const g = text.match(/(\d{1,2})\s*(personas|amigos|amigas|invitados|people|friends|guests|pax)/) ?? text.match(/\b(?:para|for)\s+(\d{1,2})\b/);
  const guests = Math.min(20, Math.max(1, g ? Number(g[1]) : fallbackGuests));

  // Cada palabra cuenta si empieza una palabra del texto ("yate" encuentra "yates").
  const picked = RULES.filter((r) => r.words.some((w) => new RegExp(`(^|[^a-z])${w}`).test(text)));
  // "chef" en un yate va a bordo, al mediodía.
  const items = picked.map((r) => {
    let time = r.time;
    if (r.id === "chef" && picked.some((p) => p.id === "yacht")) time = "13:00";
    if (r.id === "bottles" && picked.some((p) => p.id === "yacht") && !picked.some((p) => p.id === "vipTable")) time = "11:00";
    if (r.id === "photographer" && picked.some((p) => p.id === "catamaran")) time = "18:30";
    return { id: r.id, time, qty: r.qty ?? 1, guests };
  });

  const understood = items.length > 0;
  const base = understood ? items : packages[0].items.map((i) => ({ ...i, guests }));

  // Si hay salidas y no pidió chofer, ARK agrega el SUV de ida y vuelta.
  const outings = base.filter((i) => getItem(i.id)?.outing);
  if (outings.length && !base.some((i) => i.id === "suv")) {
    const start = Math.min(...outings.map((i) => toMin(i.time))) - 60;
    const end = Math.max(...outings.map((i) => toMin(i.time) + (i.qty > 1 ? i.qty * 60 : 120)));
    base.push({ id: "suv", time: toTime(Math.max(start, 0)), qty: Math.min(6, Math.max(2, Math.round((end - start) / 60))), guests });
  }

  base.sort((a, b) => toMin(a.time) - toMin(b.time));
  return { items: base, guests, understood };
}

export function planSummary(plan: Plan, locale: Locale) {
  // "Yate 50 ft" → "yate 50 ft", pero las siglas se quedan igual ("SUV con chofer").
  const lower = (n: string) => (/^[A-Z]{2}/.test(n) ? n : n[0].toLowerCase() + n.slice(1));
  const names = plan.items.map((i) => getItem(i.id)?.name[locale]).filter(Boolean).map((n) => lower(n!));
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} ${locale === "es" ? "y" : "and"} ${names.at(-1)}` : names[0];
  if (locale === "es") {
    return plan.understood
      ? `Listo. Para ${plan.guests} ${plan.guests === 1 ? "persona" : "personas"}: ${list}.`
      : `No entendí todo, así que te propongo un día en el agua: ${list}. Ajusta lo que quieras.`;
  }
  return plan.understood
    ? `Done. For ${plan.guests} ${plan.guests === 1 ? "person" : "people"}: ${list}.`
    : `I didn't catch everything, so here's a day on the water: ${list}. Adjust anything you like.`;
}

// Un servicio suelto (por ejemplo, desde un post del feed) con su hora y duración habituales.
export function defaultEntry(id: string, guests = 4): Omit<DayEntry, "uid"> {
  const rule = RULES.find((r) => r.id === id);
  return { id, time: rule?.time ?? "12:00", qty: rule?.qty ?? getItem(id)?.hours?.[0] ?? 1, guests };
}
