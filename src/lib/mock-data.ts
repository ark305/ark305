// Datos de ejemplo. En las fases 2 y 3 esto se reemplaza por Archie.
// Las fotos son de Unsplash (licencia libre) y se cambian por las fotos reales de cada proveedor.
import type { Locale, Localized } from "./locale";

export const photo = (id: string) => `https://images.unsplash.com/${id}`;

// Tipos de perfil (del prototipo): el cliente normal es "member".
export type Kind = "member" | "provider" | "creator" | "remote" | "brand";

export type Service = {
  id: string;
  kicker: Localized;
  title: Localized;
  detail: Localized;
  price: number; // en dólares
  action: "book" | "request" | "view";
  photo: string | null;
};

export type Profile = {
  handle: string;
  name: string;
  kind: Kind;
  private?: boolean; // solo visible en ARK Private (nivel VIP)
  role: Localized;
  area: string;
  near: boolean;
  photo: string | null; // null = sin foto todavía (se ven sus iniciales)
  followers: number;
  tagline: Localized;
  banner: string | null;
  socials: { network: "instagram" | "tiktok" | "facebook"; photo: string | null; url?: string }[];
  services: Service[];
  posts: string[];
};

const base = { banner: null, socials: [] as Profile["socials"], services: [] as Service[], posts: [] as string[] };

export const profiles: Profile[] = [
  {
    handle: "lente305",
    name: "Lente 305",
    kind: "creator",
    role: { es: "Foto y reels", en: "Photo & reels" },
    area: "Wynwood",
    near: true,
    photo: photo("photo-1603574670812-d24560880210"),
    followers: 15800,
    tagline: { es: "Foto, reels y drone", en: "Photo, reels & drone" },
    banner: photo("photo-1611042420087-4b643283fd5d"),
    socials: [
      { network: "instagram", photo: photo("photo-1549981832-2ba2ee913334") },
      { network: "tiktok", photo: photo("photo-1485662543942-9ab24cc0acf0") },
      { network: "facebook", photo: null },
    ],
    services: [
      {
        id: "yacht-shoot",
        kicker: { es: "EN EL AGUA", en: "ON THE WATER" },
        title: { es: "Sesión de fotos en yate", en: "Yacht photo shoot" },
        detail: { es: "2 horas · desde", en: "2 hours · from" },
        price: 450,
        action: "book",
        photo: photo("photo-1763400681783-9657ab2d5a46"),
      },
      {
        id: "reel-48h",
        kicker: { es: "CONTENIDO", en: "CONTENT" },
        title: { es: "Reel listo en 48 horas", en: "Reel ready in 48 hours" },
        detail: { es: "Edición incluida ·", en: "Editing included ·" },
        price: 250,
        action: "request",
        photo: photo("photo-1763736808904-ea253061553e"),
      },
      {
        id: "team-pack",
        kicker: { es: "EQUIPO", en: "TEAM" },
        title: { es: "Grabo con Blue Water y ClipKitchen", en: "I shoot with Blue Water & ClipKitchen" },
        detail: { es: "Paquete completo ·", en: "Full package ·" },
        price: 1200,
        action: "view",
        photo: photo("photo-1632187981988-40f3cbaeef5e"),
      },
    ],
    posts: [
      photo("photo-1589083130544-0d6a2926e519"),
      photo("photo-1653946402577-f2477b1002b7"),
      photo("photo-1605723517503-3cadb5818a0c"),
      photo("photo-1526761122248-c31c93f8b2b9"),
    ],
  },
  { ...base, handle: "bluewater", name: "Blue Water", kind: "provider", role: { es: "Yates", en: "Yachts" }, area: "Miami Beach", near: false, photo: photo("photo-1541945876617-8026869043f2"), followers: 2840, tagline: { es: "Yates privados", en: "Private yachts" } },
  { ...base, handle: "chefadri", name: "Chef Adri", kind: "provider", role: { es: "Chef privado", en: "Private chef" }, area: "Brickell", near: true, photo: photo("photo-1577219491135-ce391730fb2c"), followers: 5120, tagline: { es: "Cenas privadas", en: "Private dinners" } },
  { ...base, handle: "valentinar", name: "Valentina R.", kind: "creator", role: { es: "Modelo y creadora UGC", en: "Model & UGC creator" }, area: "Coral Gables", near: true, photo: photo("photo-1759393852314-59dc00faeed3"), followers: 12800, tagline: { es: "Contenido UGC", en: "UGC content" } },
  { ...base, handle: "skyview", name: "SkyView", kind: "provider", role: { es: "Helicópteros", en: "Helicopters" }, area: "Downtown", near: false, photo: photo("photo-1623060528744-59fb89bdc84c"), followers: 3310, tagline: { es: "Tours y traslados aéreos", en: "Air tours & transfers" } },
  { ...base, handle: "noches305", name: "Noches 305", kind: "provider", role: { es: "Mesas VIP", en: "VIP tables" }, area: "South Beach", near: false, photo: photo("photo-1578736641330-3155e606cd40"), followers: 6900, tagline: { es: "Mesas y eventos", en: "Tables & events" } },
  { ...base, handle: "danielm", name: "Daniel M.", kind: "creator", role: { es: "Videógrafo", en: "Videographer" }, area: "Wynwood", near: true, photo: photo("photo-1611784728558-6c7d9b409cdf"), followers: 4450, tagline: { es: "Video comercial", en: "Commercial video" } },
  { ...base, handle: "aeroframe", name: "AeroFrame", kind: "provider", role: { es: "Drone", en: "Drone" }, area: "Brickell", near: true, photo: photo("photo-1506947411487-a56738267384"), followers: 1560, tagline: { es: "Tomas aéreas", en: "Aerial shots" } },
  { ...base, handle: "miamiblackcar", name: "Miami Black Car", kind: "provider", role: { es: "Transporte ejecutivo", en: "Executive transport" }, area: "Doral", near: false, photo: photo("photo-1735620731955-b047a7122892"), followers: 1930, tagline: { es: "SUV y Sprinter con chofer", en: "Chauffeured SUVs & Sprinters" } },
  { ...base, handle: "camila.edita", name: "Camila S.", kind: "remote", role: { es: "Editora de reels", en: "Reels editor" }, area: "Remoto · Medellín", near: false, photo: photo("photo-1528109966604-5a6a4a964e8d"), followers: 2100, tagline: { es: "Edición remota", en: "Remote editing" } },
  { ...base, handle: "mateo.cm", name: "Mateo G.", kind: "remote", role: { es: "Community manager", en: "Community manager" }, area: "Remoto · Bogotá", near: false, photo: photo("photo-1507206130118-b5907f817163"), followers: 980, tagline: { es: "Redes y mensajes", en: "Socials & DMs" } },
  { ...base, handle: "casalimpia", name: "Casa Limpia", kind: "provider", role: { es: "Hosts de Airbnb", en: "Airbnb hosts" }, area: "Doral", near: false, photo: photo("photo-1682184805271-11671b7ecf4c"), followers: 870, tagline: { es: "Limpieza y recambios", en: "Cleaning & turnovers" } },
  { ...base, handle: "clipkitchen", name: "ClipKitchen", kind: "brand", role: { es: "Estudio de video", en: "Video studio" }, area: "Wynwood", near: true, photo: photo("photo-1579109652910-99b9be06aaec"), followers: 3900, tagline: { es: "Grabación y edición", en: "Filming & editing" } },
  { ...base, handle: "handy305", name: "Handy 305", kind: "provider", role: { es: "Handyman", en: "Handyman" }, area: "Kendall", near: false, photo: photo("photo-1731168273756-e02cae42265b"), followers: 2210, tagline: { es: "Arreglos en casa", en: "Home repairs" } },
  { ...base, handle: "mesa305", name: "Mesa 305", kind: "brand", role: { es: "Catering", en: "Catering" }, area: "Little Havana", near: false, photo: photo("photo-1555244162-803834f70033"), followers: 3400, tagline: { es: "Catering para eventos", en: "Event catering" } },
  { ...base, handle: "sunsetcharters", name: "Sunset Charters", kind: "provider", role: { es: "Catamaranes", en: "Catamarans" }, area: "Key Biscayne", near: false, photo: photo("photo-1613895571415-90c5853c6e36"), followers: 1760, tagline: { es: "Paseos al atardecer", en: "Sunset cruises" } },
  { ...base, handle: "ark305", name: "ARK305", kind: "brand", role: { es: "Cuenta oficial", en: "Official account" }, area: "Miami", near: false, photo: photo("photo-1530686577637-0ccce382b327"), followers: 15300, tagline: { es: "Tu día en Miami, en una sola app", en: "Your Miami day, in one app" } },
  // ARK Private (solo nivel VIP)
  { ...base, handle: "bayfrontprivate", name: "Bayfront Private", kind: "provider", private: true, role: { es: "Bróker de residencias", en: "Residences broker" }, area: "Brickell", near: false, photo: photo("photo-1589159812824-9d955325fe94"), followers: 6400, tagline: { es: "Preconstrucción y off-market", en: "Pre-construction & off-market" } },
  { ...base, handle: "studiomarfil", name: "Studio Marfil", kind: "provider", private: true, role: { es: "Interiorismo de autor", en: "Signature interiors" }, area: "Edgewater", near: false, photo: photo("photo-1779903726785-7cf25bed78f7"), followers: 8800, tagline: { es: "Interiores a medida", en: "Bespoke interiors" } },
  { ...base, handle: "atlasaviation", name: "Atlas Aviation", kind: "provider", private: true, role: { es: "Aviación privada", en: "Private aviation" }, area: "Opa-locka", near: false, photo: photo("photo-1768346564233-d71f37bd19b6"), followers: 4200, tagline: { es: "Jets y helicópteros", en: "Jets & helicopters" } },
  { ...base, handle: "oceanfleet", name: "Ocean Fleet", kind: "provider", private: true, role: { es: "Megayates", en: "Superyachts" }, area: "Miami Beach", near: false, photo: photo("photo-1740482881421-f4592b6575fe"), followers: 5300, tagline: { es: "Charters de 100 ft+", en: "100 ft+ charters" } },
];

// Mientras no hay inicio de sesión, "tú" eres Lente 305.
export const CURRENT_HANDLE = "lente305";
// A quién sigue "tú" (pestaña "Siguiendo" del feed).
export const FOLLOWING = ["bluewater", "chefadri", "valentinar", "ark305", "noches305"];

export function getProfile(handle: string) {
  return profiles.find((p) => p.handle === handle.toLowerCase());
}

export function formatPrice(amount: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCount(n: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "es" ? "es" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

// ---------- Feed de la comunidad (modo Buscar) ----------

// Temas del feed: con ellos aprende qué te gusta.
export type Topic = "yachts" | "food" | "content" | "air" | "news" | "nightlife" | "transport" | "home" | "remote" | "teams" | "resale" | "remodel";

export type Post = {
  id: string;
  author: string;
  kind: "photo" | "reel";
  photo: string;
  likes: number;
  text: Localized;
  exp: "lifestyle" | "business";
  topic: Topic;
  service?: string; // id del catálogo: el post muestra "Agregar a mi día"
  cta?: { href: string; label: "talent" | "team" | "resell" }; // posts de Business
};

export const posts: Post[] = [
  { id: "p1", exp: "lifestyle", topic: "yachts", author: "bluewater", kind: "reel", photo: photo("photo-1611042420087-4b643283fd5d"), likes: 412, service: "yacht", text: { es: "Sandbar con el agua turquesa este sábado. Quedan dos salidas en la tarde. #yates #biscayne", en: "Turquoise water at the sandbar this Saturday. Two afternoon trips left. #yachts #biscayne" } },
  { id: "p2", exp: "lifestyle", topic: "food", author: "chefadri", kind: "photo", photo: photo("photo-1414235077428-338989a2e8c0"), likes: 890, service: "chef", text: { es: "Menú de cuatro tiempos para 8 en una villa de Coconut Grove. #chefprivado #foodies305", en: "A four-course menu for 8 at a Coconut Grove villa. #privatechef #foodies305" } },
  { id: "p3", exp: "lifestyle", topic: "content", author: "valentinar", kind: "reel", photo: photo("photo-1759393852314-59dc00faeed3"), likes: 2310, text: { es: "Un día grabando para tres marcas en Wynwood. #creadores #ugc", en: "A day shooting for three brands in Wynwood. #creators #ugc" } },
  { id: "p4", exp: "lifestyle", topic: "air", author: "skyview", kind: "reel", photo: photo("photo-1623060528744-59fb89bdc84c"), likes: 1204, service: "heli", text: { es: "South Beach a 500 pies. Lleva gafas de sol. #desdeelaire", en: "South Beach from 500 feet. Bring sunglasses. #fromabove" } },
  { id: "p5", exp: "lifestyle", topic: "news", author: "ark305", kind: "photo", photo: photo("photo-1506869640319-fe1a24fd76dc"), likes: 1420, text: { es: "Nuevo: planea en grupo. Invita, voten y dividan el pago. #novedades", en: "New: plan as a group. Invite, vote and split the bill. #whatsnew" } },
  { id: "p6", exp: "lifestyle", topic: "nightlife", author: "noches305", kind: "reel", photo: photo("photo-1496337589254-7e19d01cec44"), likes: 1777, service: "vipTable", text: { es: "Viernes en Brickell. Mesa, host y botellas listas. #noche305", en: "Friday in Brickell. Table, host and bottles ready. #noche305" } },
  { id: "p7", exp: "lifestyle", topic: "content", author: "lente305", kind: "photo", photo: photo("photo-1763400681783-9657ab2d5a46"), likes: 958, service: "photographer", text: { es: "Fotos en yate al atardecer para una pedida de mano. #atardecer", en: "Sunset yacht photos for a proposal. #sunset" } },
  { id: "p8", exp: "lifestyle", topic: "yachts", author: "sunsetcharters", kind: "photo", photo: photo("photo-1605387202149-47169c4ea58a"), likes: 655, service: "catamaran", text: { es: "Tres horas de catamarán al atardecer. Ideal para parejas. #atardecer", en: "Three hours on a sunset catamaran. Perfect for couples. #sunset" } },
  { id: "p9", exp: "business", topic: "remote", author: "camila.edita", kind: "reel", photo: photo("photo-1502209877429-d7c6df9eb3f9"), likes: 512, cta: { href: "/talento", label: "talent" }, text: { es: "De 40 minutos de material a 12 reels. Así trabajo. #remoto #creadores", en: "From 40 minutes of footage to 12 reels. Here's how I work. #remote #creators" } },
  { id: "p10", exp: "lifestyle", topic: "transport", author: "miamiblackcar", kind: "photo", photo: photo("photo-1735620731955-b047a7122892"), likes: 167, service: "airport", text: { es: "Recogida en MIA con seguimiento de vuelo y 60 min de espera. #viajes", en: "MIA pickup with flight tracking and a 60-minute wait. #travel" } },
  { id: "p11", exp: "business", topic: "home", author: "casalimpia", kind: "photo", photo: photo("photo-1680416124510-5eae1beca412"), likes: 143, cta: { href: "/talento", label: "talent" }, text: { es: "Recambio completo en 3 horas, con reporte al host. #hostsairbnb", en: "Full turnover in 3 hours, with a report to the host. #airbnbhosts" } },
  { id: "p12", exp: "business", topic: "remodel", author: "handy305", kind: "photo", photo: photo("photo-1665507279638-5b48073c637b"), likes: 221, cta: { href: "/talento", label: "talent" }, text: { es: "Cocina lista: gabinetes montados y TV de 75\" con cables ocultos. #hogar305", en: "Kitchen done: cabinets installed and a 75\" TV with hidden cables. #home305" } },
  { id: "b1", exp: "business", topic: "resale", author: "ark305", kind: "photo", photo: photo("photo-1681949287382-052ea3954a51"), likes: 980, cta: { href: "/revender", label: "resell" }, text: { es: "Nuevo: revende paquetes de ARK con tu marca y tu margen. Tu cliente ve solo tu nombre. #revendedores", en: "New: resell ARK bundles with your brand and your margin. Your client only sees your name. #resellers" } },
  { id: "b2", exp: "business", topic: "teams", author: "ark305", kind: "photo", photo: photo("photo-1622675363311-3e1904dc1885"), likes: 764, cta: { href: "/equipo", label: "team" }, text: { es: "Equipo de ventas remoto: setter, closer y especialista CRM, listo en 72 horas. #equipos", en: "Remote sales team: setter, closer and CRM specialist, ready in 72 hours. #teams" } },
  { id: "b3", exp: "business", topic: "content", author: "clipkitchen", kind: "reel", photo: photo("photo-1632187981988-40f3cbaeef5e"), likes: 612, cta: { href: "/revender", label: "resell" }, text: { es: "30 videos para una inmobiliaria en un solo día. Paquete para agencias, con margen para revender. #agencias", en: "30 videos for a real estate firm in a single day. An agency bundle with room to resell. #agencies" } },
  { id: "b4", exp: "business", topic: "remote", author: "mateo.cm", kind: "photo", photo: photo("photo-1499914485622-a88fac536970"), likes: 233, cta: { href: "/talento", label: "talent" }, text: { es: "Una semana de respuestas en menos de 10 minutos para un restaurante. #remoto", en: "A week of replies in under 10 minutes for a restaurant. #remote" } },
  { id: "b5", exp: "business", topic: "content", author: "danielm", kind: "reel", photo: photo("photo-1485846234645-a62644f84728"), likes: 540, cta: { href: "/talento", label: "talent" }, text: { es: "Video corporativo para una clínica en Brickell: 2 horas de grabación, 6 piezas. #empresas", en: "Corporate video for a clinic in Brickell: 2 hours of filming, 6 pieces. #business" } },
];
