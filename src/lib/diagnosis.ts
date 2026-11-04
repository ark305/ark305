// Diagnóstico ARK: una conversación corta que entiende a la persona o empresa,
// y el ARK Snapshot que sale de ahí (modo, escalón, fortalezas, huecos, próximos pasos).
// Las reglas son simples y explicables ("Porque tú..."). En la etapa de IA real,
// Meta escribirá el resumen con estos mismos datos; los números nunca se inventan.
// Nunca pregunta ni deduce estatus migratorio, salud, religión, orientación ni política.
import type { Locale, Localized } from "./locale";
import type { Side } from "./mode";

export type Who = "individual" | "earner" | "company" | "enterprise";
export type Answers = Partial<Record<string, string | string[]>> & { who?: Who };

type Opt = { id: string; label: Localized };
export type Question = {
  id: string;
  ask: Localized;
  kind: "single" | "multi" | "text";
  options?: Opt[];
  placeholder?: Localized;
  showIf?: (a: Answers) => boolean;
};

const o = (id: string, es: string, en: string): Opt => ({ id, label: { es, en } });
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : a[id] ? [a[id] as string] : []);

export const WHO: Question = {
  id: "who",
  ask: { es: "Hola, soy ARK IA. Para empezar, ¿qué te trae a ARK305?", en: "Hi, I'm ARK AI. To start, what brings you to ARK305?" },
  kind: "single",
  options: [
    o("individual", "Quiero vivir Miami", "I want to live Miami"),
    o("earner", "Quiero ganar con lo que sé hacer", "I want to earn with my skills"),
    o("company", "Tengo un negocio", "I run a business"),
    o("enterprise", "Represento una empresa grande", "I represent a large company"),
  ],
};

const INDIVIDUAL: Question[] = [
  {
    id: "interests",
    ask: { es: "Genial. ¿Qué te gusta hacer en tu tiempo libre en Miami?", en: "Great. What do you like to do with your free time in Miami?" },
    kind: "multi",
    options: [
      o("water", "El agua", "The water"),
      o("food", "Comer bien", "Great food"),
      o("night", "Salir de noche", "Nightlife"),
      o("wellness", "Bienestar", "Wellness"),
      o("family", "Planes en familia", "Family plans"),
      o("content", "Crear contenido", "Creating content"),
      o("clients", "Atender clientes", "Entertaining clients"),
    ],
  },
  {
    id: "group",
    ask: { es: "¿Con quién sueles hacer planes?", en: "Who do you usually make plans with?" },
    kind: "single",
    options: [o("solo", "Solo", "Solo"), o("couple", "En pareja", "As a couple"), o("friends", "Con amigos", "With friends"), o("family", "Con la familia", "With family"), o("clients", "Con clientes", "With clients")],
  },
  {
    id: "budget",
    ask: { es: "Para un día especial, ¿qué presupuesto te queda cómodo?", en: "For a special day, what budget feels comfortable?" },
    kind: "single",
    options: [o("smart", "Inteligente", "Smart"), o("signature", "Signature", "Signature"), o("nolimits", "Sin límites", "No limits")],
  },
  {
    id: "pace",
    ask: { es: "¿Cómo te gusta el ritmo?", en: "What pace do you like?" },
    kind: "single",
    options: [o("chill", "Tranquilo", "Chill"), o("full", "A tope", "Full-on")],
  },
  {
    id: "residency",
    ask: { es: "¿Vives en Miami todo el año?", en: "Do you live in Miami year-round?" },
    kind: "single",
    options: [o("full", "Todo el año", "Year-round"), o("season", "Por temporada", "Seasonally"), o("visit", "De visita", "Visiting")],
  },
  {
    id: "support",
    ask: { es: "¿Ya tienes ayuda en casa o en tu día a día?", en: "Do you already have help at home or day to day?" },
    kind: "single",
    options: [o("none", "Nada todavía", "Nothing yet"), o("some", "Algo", "Some"), o("team", "Un equipo completo", "A full team")],
  },
  {
    id: "offer",
    ask: { es: "En ARK todos pueden contratar y también ofrecer. ¿Te gustaría ganar algo aquí?", en: "On ARK everyone can hire and also offer. Would you like to earn something here?" },
    kind: "multi",
    options: [o("skills", "Con lo que sé hacer", "With my skills"), o("assets", "Con mis cosas (bote, carro, casa)", "With my things (boat, car, home)"), o("refer", "Recomendando gente", "By referring people"), o("no", "Por ahora no", "Not for now")],
  },
];

const EARNER: Question[] = [
  {
    id: "skills",
    ask: { es: "Perfecto. ¿Qué sabes hacer hoy?", en: "Perfect. What can you do today?" },
    kind: "multi",
    options: [
      o("drive", "Manejar", "Driving"),
      o("photo", "Foto y video", "Photo & video"),
      o("ugc", "Contenido UGC", "UGC content"),
      o("edit", "Edición", "Editing"),
      o("assist", "Asistencia", "Assisting"),
      o("clean", "Limpieza", "Cleaning"),
      o("cook", "Cocina", "Cooking"),
      o("sales", "Ventas", "Sales"),
      o("tech", "Tecnología", "Tech"),
    ],
  },
  {
    id: "hours",
    ask: { es: "¿Cuántas horas a la semana tienes para trabajar?", en: "How many hours a week can you work?" },
    kind: "single",
    options: [o("5", "5", "5"), o("10", "10", "10"), o("20", "20", "20"), o("40", "40", "40")],
  },
  {
    id: "where",
    ask: { es: "¿Trabajarías en persona en Miami o remoto?", en: "Would you work in person in Miami or remotely?" },
    kind: "single",
    options: [o("miami", "En persona en Miami", "In person in Miami"), o("remote", "Remoto", "Remote"), o("both", "Las dos", "Both")],
  },
  {
    id: "country",
    ask: { es: "¿Desde qué país trabajarías?", en: "Which country would you work from?" },
    kind: "text",
    placeholder: { es: "Ej.: Colombia", en: "e.g. Colombia" },
    showIf: (a) => a.where === "remote",
  },
  {
    id: "assets",
    ask: { es: "¿Qué herramientas tienes?", en: "What tools do you have?" },
    kind: "multi",
    options: [o("car", "Carro", "Car"), o("camera", "Cámara", "Camera"), o("boat", "Licencia de bote", "Boat license"), o("laptop", "Laptop", "Laptop"), o("drone", "Drone", "Drone"), o("none", "Ninguna todavía", "None yet")],
  },
  {
    id: "blocker",
    ask: { es: "¿Qué te frena más hoy?", en: "What's holding you back most right now?" },
    kind: "single",
    options: [
      o("clients", "No tengo clientes", "No clients"),
      o("rates", "Cobro poco", "Low rates"),
      o("time", "No tengo tiempo", "No time"),
      o("skills", "Me faltan habilidades", "Missing skills"),
      o("trust", "No tengo reseñas", "No reviews yet"),
    ],
  },
  {
    id: "need",
    ask: { es: "¿Y qué te ayudaría más a crecer?", en: "And what would help you grow most?" },
    kind: "multi",
    options: [o("clients", "Clientes", "Clients"), o("training", "Capacitación", "Training"), o("team", "Un equipo", "A team"), o("tools", "Herramientas", "Tools"), o("funding", "Financiamiento", "Funding")],
  },
];

// Experiencias que necesita un negocio o empresa, y quién las recibe.
const EXP_FOR: Question = {
  id: "expFor",
  ask: { es: "Tu negocio también puede usar ARK para vivir experiencias. ¿Para quién serían?", en: "Your business can also use ARK for experiences. Who would they be for?" },
  kind: "multi",
  options: [
    o("clients", "Mis clientes", "My clients"),
    o("team", "Mi equipo", "My team"),
    o("vip", "Ejecutivos o VIP", "Executives or VIPs"),
    o("guests", "Invitados de eventos", "Event guests"),
    o("partners", "Socios o inversionistas", "Partners or investors"),
    o("none", "Por ahora no", "Not for now"),
  ],
};
const needsExperiences = (a: Answers) => list(a, "expFor").some((x) => x !== "none");
const EXP_TYPES: Question = {
  id: "expTypes",
  ask: { es: "¿Qué tipo de experiencias?", en: "What kind of experiences?" },
  kind: "multi",
  options: [
    o("entertain", "Cenas y yates con clientes", "Dinners and yachts with clients"),
    o("events", "Eventos y lanzamientos", "Events and launches"),
    o("offsite", "Retiros de equipo", "Team offsites"),
    o("travel", "Viajes ejecutivos", "Executive travel"),
    o("gifts", "Regalos e incentivos", "Gifts and incentives"),
    o("content", "Contenido para la marca", "Brand content"),
  ],
};
const EXP_FREQ: Question = {
  id: "expFreq",
  ask: { es: "¿Cada cuánto?", en: "How often?" },
  kind: "single",
  options: [o("once", "Una vez", "Once"), o("monthly", "Cada mes", "Monthly"), o("weekly", "Cada semana", "Weekly")],
};

const COMPANY: Question[] = [
  {
    id: "industry",
    ask: { es: "Buenísimo. ¿En qué industria está tu negocio?", en: "Great. What industry is your business in?" },
    kind: "single",
    options: [
      o("yachts", "Yates y charters", "Yachts & charters"),
      o("food", "Restaurante o noche", "Restaurant or nightlife"),
      o("transport", "Transporte", "Transportation"),
      o("realestate", "Bienes raíces", "Real estate"),
      o("brand", "Marca o creador", "Brand or creator"),
      o("other", "Otra", "Other"),
    ],
  },
  {
    id: "team",
    ask: { es: "¿De qué tamaño es tu negocio?", en: "How big is your business?" },
    kind: "single",
    options: [o("solo", "Solo yo", "Just me"), o("small", "Pequeño (2 a 10)", "Small (2–10)"), o("medium", "Mediano (11 a 100)", "Medium (11–100)"), o("large", "Grande (más de 100)", "Large (100+)")],
  },
  {
    id: "revenue",
    ask: { es: "¿Cuánto factura al mes, más o menos?", en: "Roughly how much does it bill per month?" },
    kind: "single",
    options: [o("lt5", "Menos de $5k", "Under $5k"), o("5-20", "$5k a $20k", "$5k to $20k"), o("20-100", "$20k a $100k", "$20k to $100k"), o("100+", "Más de $100k", "Over $100k")],
  },
  {
    id: "breaking",
    ask: { es: "¿Qué es lo que más se está rompiendo?", en: "What's breaking the most?" },
    kind: "single",
    options: [o("demand", "Me faltan clientes", "Not enough clients"), o("delivery", "Cumplir a tiempo", "Delivering on time"), o("staffing", "Conseguir personal", "Finding staff"), o("cash", "El flujo de caja", "Cash flow"), o("admin", "La administración", "Admin work")],
  },
  {
    id: "goal",
    ask: { es: "¿Y tu meta para los próximos 12 meses?", en: "And your goal for the next 12 months?" },
    kind: "single",
    options: [o("grow", "Crecer", "Grow"), o("hire", "Contratar", "Hire"), o("systems", "Ordenar procesos", "Systematize"), o("expand", "Expandirme", "Expand"), o("sell", "Vender el negocio", "Sell the business")],
  },
  EXP_FOR,
  { ...EXP_TYPES, showIf: needsExperiences },
  { ...EXP_FREQ, showIf: needsExperiences },
];

const ENTERPRISE: Question[] = [
  { id: "industry", ask: { es: "Gracias. ¿En qué industria está la empresa?", en: "Thanks. What industry is the company in?" }, kind: "text", placeholder: { es: "Ej.: hotelería, banca, tecnología", en: "e.g. hospitality, banking, tech" } },
  {
    id: "size",
    ask: { es: "¿De qué tamaño es?", en: "How big is it?" },
    kind: "single",
    options: [o("50", "50 a 200 personas", "50–200 people"), o("200", "200 a 1,000", "200–1,000"), o("1000", "Más de 1,000", "Over 1,000")],
  },
  {
    id: "needs",
    ask: { es: "¿Qué necesitan de ARK?", en: "What do you need from ARK?" },
    kind: "multi",
    options: [o("events", "Eventos y offsites", "Events & offsites"), o("travel", "Viajes ejecutivos", "Executive travel"), o("staffing", "Personal a escala", "Staffing at scale"), o("remote", "Equipos remotos", "Remote teams"), o("deals", "Compras de empresas", "Acquisitions")],
  },
  { ...EXP_FOR, id: "expFor", showIf: (a) => list(a, "needs").some((n) => n === "events" || n === "travel") },
  {
    id: "offer",
    ask: { es: "¿La empresa también ofrece algo que otros puedan contratar en ARK?", en: "Does the company also offer something others could book on ARK?" },
    kind: "multi",
    options: [o("venues", "Espacios o venues", "Spaces or venues"), o("products", "Productos", "Products"), o("services", "Servicios corporativos", "Corporate services"), o("sponsor", "Patrocinios", "Sponsorships"), o("no", "Por ahora no", "Not for now")],
  },
  {
    id: "approval",
    ask: { es: "¿Quién aprueba las compras y cada cuánto se define el presupuesto?", en: "Who approves purchases, and how often is the budget set?" },
    kind: "text",
    placeholder: { es: "Ej.: Dirección de operaciones, trimestral", en: "e.g. Head of operations, quarterly" },
  },
];

export const FLOWS: Record<Who, Question[]> = { individual: INDIVIDUAL, earner: EARNER, company: COMPANY, enterprise: ENTERPRISE };

// Siguiente pregunta sin responder (salta las que no aplican). null = terminado.
export function nextQuestion(a: Answers): Question | null {
  if (!a.who) return WHO;
  return FLOWS[a.who].find((q) => a[q.id] === undefined && (!q.showIf || q.showIf(a))) ?? null;
}

export function progress(a: Answers) {
  if (!a.who) return { done: 0, total: 6 };
  const qs = FLOWS[a.who].filter((q) => !q.showIf || q.showIf(a));
  return { done: 1 + qs.filter((q) => a[q.id] !== undefined).length, total: 1 + qs.length };
}

export function answerLabel(q: Question, value: string | string[] | undefined, locale: Locale): string {
  if (value === undefined) return "—";
  if (q.kind === "text") return String(value) || "—";
  const ids = Array.isArray(value) ? value : [value];
  return ids.map((id) => q.options?.find((x) => x.id === id)?.label[locale] ?? id).join(", ") || "—";
}

export function allQuestions(a: Answers): Question[] {
  return a.who ? [WHO, ...FLOWS[a.who]] : [WHO];
}

// Limpia respuestas que llegan del teléfono: solo preguntas y opciones conocidas.
export function sanitize(raw: unknown): Answers {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Answers = {};
  const who = a.who;
  if (who === "individual" || who === "earner" || who === "company" || who === "enterprise") out.who = who;
  if (!out.who) return out;
  for (const q of FLOWS[out.who]) {
    const v = a[q.id];
    if (v === undefined) continue;
    if (q.kind === "text") out[q.id] = String(v).slice(0, 120);
    else if (q.kind === "single" && typeof v === "string" && (v === "" || q.options!.some((x) => x.id === v))) out[q.id] = v;
    else if (q.kind === "multi" && Array.isArray(v)) out[q.id] = v.filter((x) => q.options!.some((y) => y.id === x)).slice(0, 10) as string[];
  }
  return out;
}

// ---------- ARK Snapshot ----------

export type Ladder = "starter" | "pro" | "operator" | "owner" | "exit";
export type Action = { label: Localized; href: string };
export type Snapshot = {
  who: Who;
  side: Side;
  enterprise: boolean;
  ladder: Ladder | null;
  summary: Localized;
  reason: Localized;
  strengths: Localized[];
  gaps: Localized[];
  opportunities: Localized[];
  actions: Action[];
  course: { id: string; reason: Localized };
  dayPrompt?: Localized;
  health?: { score: number; metric: Localized };
  blueprint?: string[]; // ids de puestos de Talento
  // Todos pueden ser cliente y proveedor a la vez:
  demand: Localized[]; // lo que necesita de ARK
  supply: Localized[]; // lo que puede ofrecer en ARK
  size?: Localized; // pequeño, mediano o grande
  experiences?: { recipients: Localized; kinds: Localized; freq?: Localized; prompt: Localized };
};
