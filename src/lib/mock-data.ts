// Datos de ejemplo. En las fases 2 y 3 esto se reemplaza por Supabase.
// Las fotos son de Unsplash (licencia libre) y se cambian por las fotos reales de cada proveedor.
import type { Localized } from "./locale";

export type Category = "content" | "yachts" | "food" | "home" | "nightlife";

const photo = (id: string) => `https://images.unsplash.com/${id}`;

export type Service = {
  id: string;
  kicker: Localized;
  title: Localized;
  detail: Localized;
  price: number; // en dólares
  action: "book" | "request" | "view";
  photo: string;
};

export type Profile = {
  handle: string;
  name: string;
  initials: string;
  role: Localized;
  area: string;
  category: Category;
  near: boolean;
  photo: string;
  followers: Localized | null;
  tagline: Localized;
  banner: string | null;
  socials: { network: "instagram" | "tiktok" | "facebook"; photo: string | null }[];
  services: Service[];
  posts: string[];
};

const base = { followers: null, banner: null, socials: [] as Profile["socials"], services: [] as Service[], posts: [] as string[] };

export const profiles: Profile[] = [
  {
    handle: "lente305",
    name: "Lente 305",
    initials: "L3",
    role: { es: "Foto y reels", en: "Photo & reels" },
    area: "Wynwood",
    category: "content",
    near: true,
    photo: photo("photo-1603574670812-d24560880210"),
    followers: { es: "15,8 mil", en: "15.8K" },
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
  { ...base, handle: "aeroframe", name: "AeroFrame", initials: "AF", role: { es: "Drone", en: "Drone" }, area: "Brickell", category: "content", near: true, photo: photo("photo-1506947411487-a56738267384"), tagline: { es: "Tomas aéreas", en: "Aerial shots" } },
  { ...base, handle: "bluewater", name: "Blue Water", initials: "BW", role: { es: "Yates", en: "Yachts" }, area: "Miami Beach", category: "yachts", near: false, photo: photo("photo-1541945876617-8026869043f2"), tagline: { es: "Yates privados", en: "Private yachts" } },
  { ...base, handle: "casalimpia", name: "Casa Limpia", initials: "CL", role: { es: "Hosts", en: "Hosts" }, area: "Doral", category: "home", near: false, photo: photo("photo-1682184805271-11671b7ecf4c"), tagline: { es: "Limpieza para Airbnb", en: "Airbnb cleaning" } },
  { ...base, handle: "noches305", name: "Noches 305", initials: "N3", role: { es: "Vida nocturna", en: "Nightlife" }, area: "South Beach", category: "nightlife", near: false, photo: photo("photo-1578736641330-3155e606cd40"), tagline: { es: "Mesas y eventos", en: "Tables & events" } },
  { ...base, handle: "clipkitchen", name: "ClipKitchen", initials: "CK", role: { es: "Edición", en: "Editing" }, area: "Remoto", category: "content", near: false, photo: photo("photo-1579109652910-99b9be06aaec"), tagline: { es: "Edición de video", en: "Video editing" } },
  { ...base, handle: "valentinar", name: "Valentina R.", initials: "VR", role: { es: "UGC", en: "UGC" }, area: "Coral Gables", category: "content", near: true, photo: photo("photo-1759393852314-59dc00faeed3"), tagline: { es: "Contenido UGC", en: "UGC content" } },
  { ...base, handle: "danielm", name: "Daniel M.", initials: "DM", role: { es: "Video", en: "Video" }, area: "Wynwood", category: "content", near: true, photo: photo("photo-1611784728558-6c7d9b409cdf"), tagline: { es: "Video comercial", en: "Commercial video" } },
  { ...base, handle: "handy305", name: "Handy 305", initials: "H3", role: { es: "Hogar", en: "Home" }, area: "Kendall", category: "home", near: false, photo: photo("photo-1731168273756-e02cae42265b"), tagline: { es: "Arreglos en casa", en: "Home repairs" } },
  { ...base, handle: "chefadri", name: "Chef Adri", initials: "CA", role: { es: "Chef privado", en: "Private chef" }, area: "Brickell", category: "food", near: true, photo: photo("photo-1577219491135-ce391730fb2c"), tagline: { es: "Cenas privadas", en: "Private dinners" } },
  { ...base, handle: "mesa305", name: "Mesa 305", initials: "M3", role: { es: "Catering", en: "Catering" }, area: "Little Havana", category: "food", near: false, photo: photo("photo-1555244162-803834f70033"), tagline: { es: "Catering para eventos", en: "Event catering" } },
  { ...base, handle: "sunsetcharters", name: "Sunset Charters", initials: "SC", role: { es: "Yates", en: "Yachts" }, area: "Key Biscayne", category: "yachts", near: false, photo: photo("photo-1613895571415-90c5853c6e36"), tagline: { es: "Paseos al atardecer", en: "Sunset cruises" } },
];

// Mientras no hay inicio de sesión, "tú" eres Lente 305.
export const CURRENT_HANDLE = "lente305";

export function getProfile(handle: string) {
  return profiles.find((p) => p.handle === handle.toLowerCase());
}

export function formatPrice(amount: number, locale: "es" | "en") {
  return new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
