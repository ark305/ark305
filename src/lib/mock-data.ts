// Datos de ejemplo de la Fase 1. En la Fase 2 y 3 esto se reemplaza por Supabase.
import type { Localized } from "./locale";

export type Category = "content" | "yachts" | "food" | "home" | "nightlife";

export type Service = {
  id: string;
  kicker: Localized;
  title: Localized;
  detail: Localized;
  price: number; // en dólares
  action: "book" | "request" | "view";
};

export type Profile = {
  handle: string;
  name: string;
  initials: string;
  role: Localized;
  area: string;
  category: Category;
  near: boolean;
  tone: string; // color de fondo mientras no hay foto real
  followers: Localized | null;
  tagline: Localized;
  socials: ("instagram" | "tiktok" | "facebook")[];
  services: Service[];
};

const base = { followers: null, socials: [] as Profile["socials"], services: [] as Service[] };

export const profiles: Profile[] = [
  {
    handle: "lente305",
    name: "Lente 305",
    initials: "L3",
    role: { es: "Foto y reels", en: "Photo & reels" },
    area: "Wynwood",
    category: "content",
    near: true,
    tone: "#1E1C19",
    followers: { es: "15,8 mil", en: "15.8K" },
    tagline: { es: "Foto, reels y drone", en: "Photo, reels & drone" },
    socials: ["instagram", "tiktok", "facebook"],
    services: [
      {
        id: "yacht-shoot",
        kicker: { es: "EN EL AGUA", en: "ON THE WATER" },
        title: { es: "Sesión de fotos en yate", en: "Yacht photo shoot" },
        detail: { es: "2 horas · desde", en: "2 hours · from" },
        price: 450,
        action: "book",
      },
      {
        id: "reel-48h",
        kicker: { es: "CONTENIDO", en: "CONTENT" },
        title: { es: "Reel listo en 48 horas", en: "Reel ready in 48 hours" },
        detail: { es: "Edición incluida ·", en: "Editing included ·" },
        price: 250,
        action: "request",
      },
      {
        id: "team-pack",
        kicker: { es: "EQUIPO", en: "TEAM" },
        title: { es: "Grabo con Blue Water y ClipKitchen", en: "I shoot with Blue Water & ClipKitchen" },
        detail: { es: "Paquete completo ·", en: "Full package ·" },
        price: 1200,
        action: "view",
      },
    ],
  },
  { ...base, handle: "aeroframe", name: "AeroFrame", initials: "AF", role: { es: "Drone", en: "Drone" }, area: "Brickell", category: "content", near: true, tone: "#171B1F", tagline: { es: "Tomas aéreas", en: "Aerial shots" } },
  { ...base, handle: "bluewater", name: "Blue Water", initials: "BW", role: { es: "Yates", en: "Yachts" }, area: "Miami Beach", category: "yachts", near: false, tone: "#141D1F", tagline: { es: "Yates privados", en: "Private yachts" } },
  { ...base, handle: "casalimpia", name: "Casa Limpia", initials: "CL", role: { es: "Hosts", en: "Hosts" }, area: "Doral", category: "home", near: false, tone: "#1D1A1A", tagline: { es: "Limpieza para Airbnb", en: "Airbnb cleaning" } },
  { ...base, handle: "noches305", name: "Noches 305", initials: "N3", role: { es: "Vida nocturna", en: "Nightlife" }, area: "South Beach", category: "nightlife", near: false, tone: "#1B1720", tagline: { es: "Mesas y eventos", en: "Tables & events" } },
  { ...base, handle: "clipkitchen", name: "ClipKitchen", initials: "CK", role: { es: "Edición", en: "Editing" }, area: "Remoto", category: "content", near: false, tone: "#1A1C17", tagline: { es: "Edición de video", en: "Video editing" } },
  { ...base, handle: "valentinar", name: "Valentina R.", initials: "VR", role: { es: "UGC", en: "UGC" }, area: "Coral Gables", category: "content", near: true, tone: "#201A1B", tagline: { es: "Contenido UGC", en: "UGC content" } },
  { ...base, handle: "danielm", name: "Daniel M.", initials: "DM", role: { es: "Video", en: "Video" }, area: "Wynwood", category: "content", near: true, tone: "#181A1F", tagline: { es: "Video comercial", en: "Commercial video" } },
  { ...base, handle: "handy305", name: "Handy 305", initials: "H3", role: { es: "Hogar", en: "Home" }, area: "Kendall", category: "home", near: false, tone: "#1C1B16", tagline: { es: "Arreglos en casa", en: "Home repairs" } },
  { ...base, handle: "chefadri", name: "Chef Adri", initials: "CA", role: { es: "Chef privado", en: "Private chef" }, area: "Brickell", category: "food", near: true, tone: "#1F1A16", tagline: { es: "Cenas privadas", en: "Private dinners" } },
  { ...base, handle: "mesa305", name: "Mesa 305", initials: "M3", role: { es: "Catering", en: "Catering" }, area: "Little Havana", category: "food", near: false, tone: "#1A1D1A", tagline: { es: "Catering para eventos", en: "Event catering" } },
  { ...base, handle: "sunsetcharters", name: "Sunset Charters", initials: "SC", role: { es: "Yates", en: "Yachts" }, area: "Key Biscayne", category: "yachts", near: false, tone: "#16191F", tagline: { es: "Paseos al atardecer", en: "Sunset cruises" } },
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
