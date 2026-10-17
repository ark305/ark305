// ARK Video: versión solo de videógrafos para el evento (reservar + organizar el contenido).
// Videógrafos, precios y horarios son de demostración.
import type { Locale, Localized } from "./locale";
import { photo } from "./mock-data";

export type VideoPackage = {
  id: "reel" | "social" | "event" | "brand";
  name: Localized;
  desc: Localized;
  price: number;
  hours: number;
  includes: Localized[];
};

export const videoPackages: VideoPackage[] = [
  {
    id: "reel",
    name: { es: "Reel express", en: "Express reel" },
    desc: { es: "Un reel vertical listo para publicar.", en: "One vertical reel, ready to post." },
    price: 650,
    hours: 2,
    includes: [
      { es: "2 h de grabación", en: "2 h of filming" },
      { es: "1 reel de 30–60 s editado", en: "1 edited 30–60 s reel" },
      { es: "Entrega en 48 h", en: "Delivered in 48 h" },
    ],
  },
  {
    id: "social",
    name: { es: "Pack redes", en: "Social pack" },
    desc: { es: "Un mes de contenido en una sola sesión.", en: "A month of content in one session." },
    price: 1500,
    hours: 3,
    includes: [
      { es: "3 h de grabación", en: "3 h of filming" },
      { es: "6 reels + 20 fotos", en: "6 reels + 20 photos" },
      { es: "Calendario de publicación", en: "Posting calendar" },
    ],
  },
  {
    id: "event",
    name: { es: "Cobertura de evento", en: "Event coverage" },
    desc: { es: "Tu evento contado en video, con clips el mismo día.", en: "Your event told on video, with same-day clips." },
    price: 1800,
    hours: 4,
    includes: [
      { es: "4 h de cobertura", en: "4 h of coverage" },
      { es: "Recap de 90 s + 10 clips", en: "90 s recap + 10 clips" },
      { es: "3 clips en 24 h", en: "3 clips within 24 h" },
    ],
  },
  {
    id: "brand",
    name: { es: "Día de marca", en: "Brand day" },
    desc: { es: "Video de marca y contenido para todo el trimestre.", en: "A brand film and content for the whole quarter." },
    price: 3900,
    hours: 8,
    includes: [
      { es: "8 h con equipo de 2", en: "8 h with a crew of 2" },
      { es: "Video de marca de 2 min + 15 reels", en: "2 min brand film + 15 reels" },
      { es: "Guion y dirección creativa", en: "Script and creative direction" },
    ],
  },
];

export const getVideoPackage = (id: string) => videoPackages.find((p) => p.id === id);

export type Videographer = {
  id: string;
  name: string;
  area: string;
  rating: number;
  jobs: number;
  photo: string;
  specialty: Localized;
  style: Localized;
  packages: VideoPackage["id"][];
  // Horarios de hoy en bloques de 2 h; false = ya reservado.
  slots: { time: string; open: boolean }[];
};

const day = (taken: string[]) =>
  ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((time) => ({ time, open: !taken.includes(time) }));

export const videographers: Videographer[] = [
  {
    id: "ark-films",
    name: "ARK Films",
    area: "Brickell",
    rating: 5.0,
    jobs: 212,
    photo: photo("photo-1485846234645-a62644f84728"),
    specialty: { es: "Marcas, eventos y lujo", en: "Brands, events and luxury" },
    style: { es: "Cinemático, ritmo de comercial", en: "Cinematic, commercial pacing" },
    packages: ["event", "brand", "social"],
    slots: day(["10:00", "18:00"]),
  },
  {
    id: "danielm",
    name: "Daniel M.",
    area: "Wynwood",
    rating: 4.9,
    jobs: 138,
    photo: photo("photo-1611784728558-6c7d9b409cdf"),
    specialty: { es: "Reels para negocios", en: "Reels for businesses" },
    style: { es: "Directo, con ganchos en los primeros 3 s", en: "Direct, hooks in the first 3 s" },
    packages: ["reel", "social"],
    slots: day(["08:00", "14:00"]),
  },
  {
    id: "clipkitchen",
    name: "ClipKitchen",
    area: "Wynwood",
    rating: 4.8,
    jobs: 96,
    photo: photo("photo-1579109652910-99b9be06aaec"),
    specialty: { es: "Estudio: restaurantes y producto", en: "Studio: restaurants and product" },
    style: { es: "Luz de estudio, detalle y textura", en: "Studio light, detail and texture" },
    packages: ["reel", "social", "brand"],
    slots: day(["12:00", "16:00", "20:00"]),
  },
  {
    id: "luz-studio",
    name: "Luz Studio",
    area: "Coral Gables",
    rating: 4.9,
    jobs: 174,
    photo: photo("photo-1763736808904-ea253061553e"),
    specialty: { es: "Eventos, bodas y celebraciones", en: "Events, weddings and celebrations" },
    style: { es: "Documental, emocional", en: "Documentary, emotional" },
    packages: ["event", "reel"],
    slots: day(["16:00", "18:00"]),
  },
  {
    id: "aeroframe",
    name: "AeroFrame",
    area: "Miami Beach",
    rating: 4.8,
    jobs: 81,
    photo: photo("photo-1506947411487-a56738267384"),
    specialty: { es: "Drone y real estate", en: "Drone and real estate" },
    style: { es: "Tomas aéreas con piloto licenciado", en: "Aerial shots with a licensed pilot" },
    packages: ["reel", "brand"],
    slots: day(["08:00", "20:00"]),
  },
];

export const getVideographer = (id: string) => videographers.find((v) => v.id === id);

// ---------- Plan de contenido (lo arma ARK IA; sin IA, una plantilla demo) ----------

export type ContentPlan = {
  title: string;
  summary: string;
  shots: { scene: string; detail: string }[];
  deliverables: { name: string; format: string; due: string }[];
  calendar: { day: string; piece: string; platform: string }[];
  packageId: VideoPackage["id"];
  source: "ai" | "demo";
};

type Kind = "event" | "realestate" | "food" | "business";

const KIND_WORDS: [Kind, string[]][] = [
  ["event", ["evento", "event", "hackathon", "conferencia", "conference", "boda", "wedding", "fiesta", "party", "lanzamiento", "launch", "cumple"]],
  ["realestate", ["inmobiliari", "real estate", "propiedad", "property", "casa", "house", "condo", "residencia", "residence", "developer", "airbnb"]],
  ["food", ["restaurante", "restaurant", "comida", "food", "chef", "café", "cafe", "bar", "menú", "menu"]],
];

export function detectKind(brief: string): Kind {
  const b = brief.toLowerCase();
  return KIND_WORDS.find(([, words]) => words.some((w) => b.includes(w)))?.[0] ?? "business";
}

const DEMO: Record<Kind, Record<Locale, Omit<ContentPlan, "source" | "packageId">> & { packageId: VideoPackage["id"] }> = {
  event: {
    packageId: "event",
    es: {
      title: "Cobertura del evento en video",
      summary: "Contar el evento en 90 s, publicar 3 clips el mismo día y mantener la conversación una semana más.",
      shots: [
        { scene: "Llegada y ambiente", detail: "Planos abiertos del lugar, registro y gente entrando." },
        { scene: "Momento principal", detail: "Escenario o presentación, desde dos ángulos." },
        { scene: "Entrevistas rápidas", detail: "3–5 asistentes: ¿qué te llevas de hoy? (15 s cada una)." },
        { scene: "Detalles de marca", detail: "Logos, producto y pantallas, en primer plano." },
        { scene: "Cierre", detail: "Aplausos, networking y salida al atardecer." },
      ],
      deliverables: [
        { name: "Recap del evento", format: "90 s · 16:9 y 9:16", due: "72 h" },
        { name: "Clips del día", format: "3 × 20 s · 9:16", due: "Mismo día" },
        { name: "Entrevistas", format: "5 × 15 s · 9:16", due: "48 h" },
      ],
      calendar: [
        { day: "Hoy", piece: "Clip 1: el momento principal", platform: "Instagram Reels" },
        { day: "Hoy", piece: "Clip 2: ambiente", platform: "TikTok" },
        { day: "Mañana", piece: "Clip 3: entrevista destacada", platform: "LinkedIn" },
        { day: "Día 3", piece: "Recap completo", platform: "Instagram + YouTube" },
        { day: "Día 5", piece: "Carrusel de fotos y aprendizajes", platform: "LinkedIn" },
      ],
    },
    en: {
      title: "Event coverage on video",
      summary: "Tell the event in 90 s, post 3 clips the same day and keep the conversation going for another week.",
      shots: [
        { scene: "Arrival and atmosphere", detail: "Wide shots of the venue, check-in and people arriving." },
        { scene: "Main moment", detail: "Stage or presentation, from two angles." },
        { scene: "Quick interviews", detail: "3–5 attendees: what are you taking away today? (15 s each)." },
        { scene: "Brand details", detail: "Logos, product and screens, in close-up." },
        { scene: "Close", detail: "Applause, networking and leaving at sunset." },
      ],
      deliverables: [
        { name: "Event recap", format: "90 s · 16:9 and 9:16", due: "72 h" },
        { name: "Same-day clips", format: "3 × 20 s · 9:16", due: "Same day" },
        { name: "Interviews", format: "5 × 15 s · 9:16", due: "48 h" },
      ],
      calendar: [
        { day: "Today", piece: "Clip 1: the main moment", platform: "Instagram Reels" },
        { day: "Today", piece: "Clip 2: atmosphere", platform: "TikTok" },
        { day: "Tomorrow", piece: "Clip 3: best interview", platform: "LinkedIn" },
        { day: "Day 3", piece: "Full recap", platform: "Instagram + YouTube" },
        { day: "Day 5", piece: "Photo carousel and takeaways", platform: "LinkedIn" },
      ],
    },
  },
  realestate: {
    packageId: "brand",
    es: {
      title: "Video de propiedad que vende",
      summary: "Mostrar la propiedad como una forma de vivir: tour, drone y piezas cortas para captar compradores.",
      shots: [
        { scene: "Aéreas con drone", detail: "Ubicación, vista al agua y la ciudad." },
        { scene: "Recorrido continuo", detail: "Entrada → sala → cocina → terraza, en una sola toma." },
        { scene: "Detalles", detail: "Acabados, luz natural y amenidades." },
        { scene: "Lifestyle", detail: "Una persona viviendo el espacio: café, piscina, atardecer." },
        { scene: "Agente o developer", detail: "30 s a cámara: por qué esta propiedad." },
      ],
      deliverables: [
        { name: "Tour de la propiedad", format: "2 min · 16:9", due: "5 días" },
        { name: "Reels de detalle", format: "6 × 20 s · 9:16", due: "3 días" },
        { name: "Fotos", format: "25 fotos editadas", due: "48 h" },
      ],
      calendar: [
        { day: "Día 1", piece: "Teaser aéreo", platform: "Instagram Reels" },
        { day: "Día 2", piece: "Reel: la terraza al atardecer", platform: "TikTok" },
        { day: "Día 4", piece: "Tour completo", platform: "YouTube + web" },
        { day: "Día 6", piece: "Agente a cámara", platform: "Instagram + LinkedIn" },
        { day: "Día 8", piece: "Carrusel de fotos", platform: "Instagram" },
      ],
    },
    en: {
      title: "A property video that sells",
      summary: "Show the property as a way of living: a tour, drone and short pieces to attract buyers.",
      shots: [
        { scene: "Drone aerials", detail: "Location, water view and the city." },
        { scene: "Continuous walkthrough", detail: "Entrance → living room → kitchen → terrace, in one take." },
        { scene: "Details", detail: "Finishes, natural light and amenities." },
        { scene: "Lifestyle", detail: "Someone living the space: coffee, pool, sunset." },
        { scene: "Agent or developer", detail: "30 s to camera: why this property." },
      ],
      deliverables: [
        { name: "Property tour", format: "2 min · 16:9", due: "5 days" },
        { name: "Detail reels", format: "6 × 20 s · 9:16", due: "3 days" },
        { name: "Photos", format: "25 edited photos", due: "48 h" },
      ],
      calendar: [
        { day: "Day 1", piece: "Aerial teaser", platform: "Instagram Reels" },
        { day: "Day 2", piece: "Reel: the terrace at sunset", platform: "TikTok" },
        { day: "Day 4", piece: "Full tour", platform: "YouTube + web" },
        { day: "Day 6", piece: "Agent to camera", platform: "Instagram + LinkedIn" },
        { day: "Day 8", piece: "Photo carousel", platform: "Instagram" },
      ],
    },
  },
  food: {
    packageId: "social",
    es: {
      title: "Un mes de contenido para tu restaurante",
      summary: "Que den ganas de reservar: platos, equipo y ambiente, en reels cortos para todo el mes.",
      shots: [
        { scene: "Plato estrella", detail: "Preparación en cocina y emplatado en cámara lenta." },
        { scene: "El chef", detail: "La historia del plato contada en 20 s." },
        { scene: "Ambiente", detail: "Mesas llenas, barra y luz de la noche." },
        { scene: "Bebidas", detail: "Coctelería en primer plano." },
        { scene: "Clientes", detail: "Reacciones al primer bocado." },
      ],
      deliverables: [
        { name: "Reels", format: "6 × 20–30 s · 9:16", due: "5 días" },
        { name: "Fotos de menú", format: "20 fotos", due: "48 h" },
        { name: "Calendario", format: "4 semanas", due: "Con la entrega" },
      ],
      calendar: [
        { day: "Semana 1", piece: "Plato estrella", platform: "Instagram Reels" },
        { day: "Semana 1", piece: "El chef cuenta su historia", platform: "TikTok" },
        { day: "Semana 2", piece: "Coctelería", platform: "Instagram" },
        { day: "Semana 3", piece: "Reacciones de clientes", platform: "TikTok" },
        { day: "Semana 4", piece: "Noche completa en 30 s", platform: "Instagram + Google" },
      ],
    },
    en: {
      title: "A month of content for your restaurant",
      summary: "Make people want to book: dishes, team and atmosphere, in short reels for the whole month.",
      shots: [
        { scene: "Signature dish", detail: "Prep in the kitchen and plating in slow motion." },
        { scene: "The chef", detail: "The story of the dish in 20 s." },
        { scene: "Atmosphere", detail: "Full tables, the bar and evening light." },
        { scene: "Drinks", detail: "Cocktails in close-up." },
        { scene: "Guests", detail: "Reactions to the first bite." },
      ],
      deliverables: [
        { name: "Reels", format: "6 × 20–30 s · 9:16", due: "5 days" },
        { name: "Menu photos", format: "20 photos", due: "48 h" },
        { name: "Calendar", format: "4 weeks", due: "With delivery" },
      ],
      calendar: [
        { day: "Week 1", piece: "Signature dish", platform: "Instagram Reels" },
        { day: "Week 1", piece: "The chef tells their story", platform: "TikTok" },
        { day: "Week 2", piece: "Cocktails", platform: "Instagram" },
        { day: "Week 3", piece: "Guest reactions", platform: "TikTok" },
        { day: "Week 4", piece: "A full night in 30 s", platform: "Instagram + Google" },
      ],
    },
  },
  business: {
    packageId: "social",
    es: {
      title: "Contenido para tu negocio",
      summary: "Una sesión, un mes de contenido: quién eres, qué haces y por qué elegirte.",
      shots: [
        { scene: "Fundador a cámara", detail: "El problema que resuelves, en 20 s." },
        { scene: "Detrás de cámaras", detail: "El equipo trabajando y el proceso." },
        { scene: "Producto o servicio", detail: "Cómo se usa y el resultado." },
        { scene: "Cliente feliz", detail: "Testimonio corto." },
        { scene: "Llamada a la acción", detail: "Dónde comprar o reservar." },
      ],
      deliverables: [
        { name: "Reels", format: "6 × 20–40 s · 9:16", due: "5 días" },
        { name: "Fotos", format: "20 fotos", due: "48 h" },
        { name: "Calendario", format: "4 semanas", due: "Con la entrega" },
      ],
      calendar: [
        { day: "Semana 1", piece: "Fundador: por qué existimos", platform: "Instagram + LinkedIn" },
        { day: "Semana 1", piece: "Detrás de cámaras", platform: "TikTok" },
        { day: "Semana 2", piece: "Producto en acción", platform: "Instagram Reels" },
        { day: "Semana 3", piece: "Testimonio", platform: "Instagram + Facebook" },
        { day: "Semana 4", piece: "Oferta con llamada a la acción", platform: "Anuncios" },
      ],
    },
    en: {
      title: "Content for your business",
      summary: "One session, one month of content: who you are, what you do and why choose you.",
      shots: [
        { scene: "Founder to camera", detail: "The problem you solve, in 20 s." },
        { scene: "Behind the scenes", detail: "The team at work and the process." },
        { scene: "Product or service", detail: "How it's used and the result." },
        { scene: "Happy customer", detail: "A short testimonial." },
        { scene: "Call to action", detail: "Where to buy or book." },
      ],
      deliverables: [
        { name: "Reels", format: "6 × 20–40 s · 9:16", due: "5 days" },
        { name: "Photos", format: "20 photos", due: "48 h" },
        { name: "Calendar", format: "4 weeks", due: "With delivery" },
      ],
      calendar: [
        { day: "Week 1", piece: "Founder: why we exist", platform: "Instagram + LinkedIn" },
        { day: "Week 1", piece: "Behind the scenes", platform: "TikTok" },
        { day: "Week 2", piece: "Product in action", platform: "Instagram Reels" },
        { day: "Week 3", piece: "Testimonial", platform: "Instagram + Facebook" },
        { day: "Week 4", piece: "Offer with a call to action", platform: "Ads" },
      ],
    },
  },
};

export function demoPlan(brief: string, locale: Locale): ContentPlan {
  const kind = DEMO[detectKind(brief)];
  return { ...kind[locale], packageId: kind.packageId, source: "demo" };
}

// Limpia la respuesta de la IA para que la pantalla nunca reciba algo roto.
export function sanitizePlan(raw: unknown): ContentPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max = 160) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const list = <T,>(v: unknown, map: (x: Record<string, unknown>) => T | null, max: number) =>
    (Array.isArray(v) ? v : [])
      .map((x) => (x && typeof x === "object" ? map(x as Record<string, unknown>) : null))
      .filter((x): x is T => x !== null)
      .slice(0, max);

  const shots = list(r.shots, (x) => (str(x.scene) ? { scene: str(x.scene, 60), detail: str(x.detail) } : null), 7);
  const deliverables = list(r.deliverables, (x) => (str(x.name) ? { name: str(x.name, 60), format: str(x.format, 60), due: str(x.due, 30) } : null), 5);
  const calendar = list(r.calendar, (x) => (str(x.piece) ? { day: str(x.day, 30), piece: str(x.piece, 90), platform: str(x.platform, 40) } : null), 7);
  const pkg = getVideoPackage(str(r.packageId, 20));
  if (!str(r.title) || shots.length < 3 || deliverables.length < 1 || calendar.length < 3) return null;
  return { title: str(r.title, 80), summary: str(r.summary, 240), shots, deliverables, calendar, packageId: pkg?.id ?? "social", source: "ai" };
}
