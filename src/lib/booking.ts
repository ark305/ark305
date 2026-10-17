// Reservas: tipos compartidos y catálogo demo (se usa cuando Archie no está configurado o falla).
export type ServiceType = "driver" | "yacht" | "chef" | "videographer" | "photographer" | "cleaning";

export type CatalogService = {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  price: number;
  price_unit: string;
  provider_name: string;
  rating: number | null;
};

export type Slot = { id: string; service_id: string; date: string; start_time: string; end_time: string; available: boolean };

export type BookingStatus = "requested" | "confirmed" | "en_route" | "arrived" | "in_service" | "done" | "cancelled";

export type Booking = {
  id: string;
  status: BookingStatus;
  guests: number;
  notes: string | null;
  price: number;
  service_name: string;
  type: ServiceType | null;
  provider_name: string;
  date: string;
  start_time: string;
  end_time: string;
};

export type Availability = { source: "live" | "demo"; date: string; services: CatalogService[]; slots: Slot[] };

export const SERVICE_TYPES: ServiceType[] = ["yacht", "chef", "driver", "videographer", "photographer", "cleaning"];

const DEMO_SERVICES: CatalogService[] = [
  { id: "11111111-1111-1111-1111-000000000001", name: "Private driver", type: "driver", description: "Chofer privado en SUV de lujo por Miami.", price: 85, price_unit: "hour", provider_name: "Elite Drive MIA", rating: 4.9 },
  { id: "11111111-1111-1111-1111-000000000002", name: "60ft yacht", type: "yacht", description: "Yate de 60 pies con capitán por la bahía de Biscayne.", price: 450, price_unit: "hour", provider_name: "Biscayne Yacht Co", rating: 5 },
  { id: "11111111-1111-1111-1111-000000000003", name: "Private chef", type: "chef", description: "Chef privado en tu residencia o a bordo.", price: 150, price_unit: "person", provider_name: "Chef Laurent", rating: 4.8 },
  { id: "11111111-1111-1111-1111-000000000004", name: "Videographer", type: "videographer", description: "Videógrafo para eventos y contenido.", price: 750, price_unit: "day", provider_name: "ARK Films", rating: 5 },
  { id: "11111111-1111-1111-1111-000000000005", name: "Photographer", type: "photographer", description: "Fotógrafo para eventos, retratos y residencias.", price: 500, price_unit: "day", provider_name: "Luz Studio", rating: 4.9 },
  { id: "11111111-1111-1111-1111-000000000006", name: "Home cleaning", type: "cleaning", description: "Limpieza profesional de residencias.", price: 45, price_unit: "hour", provider_name: "Pristine MIA", rating: 4.7 },
];

const pad = (n: number) => String(n).padStart(2, "0");

// Horarios de 2 horas, de 8am a 10pm (hora de Miami).
export const SLOT_HOURS = [8, 10, 12, 14, 16, 18, 20];
export const SLOT_LEN_H = 2;

export function demoAvailability(date: string): Availability {
  const slots: Slot[] = DEMO_SERVICES.flatMap((s) =>
    SLOT_HOURS.map((h) => ({
      id: `demo-${s.id.slice(-2)}-${date}-${h}`,
      service_id: s.id,
      date,
      start_time: `${pad(h)}:00:00`,
      end_time: `${pad(h + SLOT_LEN_H)}:00:00`,
      available: !(s.type === "yacht" && date === "2026-10-17" && h === 18),
    })),
  );
  return { source: "demo", date, services: DEMO_SERVICES, slots };
}

// Fecha de hoy en Miami (YYYY-MM-DD), sin depender de la zona horaria del servidor.
export function miamiDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
}

export const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-zA-Z-]{8,64}$/.test(v);

// El instante en que son las `hour` en Miami ese día (EDT o EST según la fecha).
export function miamiInstant(date: string, hour: number) {
  const [y, m, d] = date.split("-").map(Number);
  for (const off of [4, 5]) {
    const t = new Date(Date.UTC(y, m - 1, d, hour + off));
    if (miamiParts(t).date === date && miamiParts(t).time.startsWith(String(hour).padStart(2, "0"))) return t;
  }
  return new Date(Date.UTC(y, m - 1, d, hour + 5));
}

// Fecha (YYYY-MM-DD) y hora (HH:MM:00) de un instante, en Miami.
export function miamiParts(t: Date) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(t);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(t);
  return { date, time: `${time}:00` };
}
