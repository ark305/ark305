// Reservas: tipos compartidos y catálogo demo (se usa cuando Supabase no está configurado o falla).
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
  price_unit: string;
  created_at: string;
  catalog_services: { name: string; type: ServiceType; provider_name: string } | null;
  availability_slots: { date: string; start_time: string; end_time: string } | null;
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

export function demoAvailability(date: string): Availability {
  const slots: Slot[] = DEMO_SERVICES.flatMap((s) =>
    [8, 10, 12, 14, 16, 18, 20].map((h) => ({
      id: `demo-${s.id.slice(-2)}-${date}-${h}`,
      service_id: s.id,
      date,
      start_time: `${pad(h)}:00:00`,
      end_time: `${pad(h + 2)}:00:00`,
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
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// Errores de las funciones SQL → respuesta HTTP.
export function rpcError(message: string | undefined) {
  const code = ["slot_taken", "auth_required", "not_cancellable", "not_allowed", "bad_transition"].find((c) => message?.includes(c));
  const status = code === "slot_taken" ? 409 : code === "auth_required" ? 401 : code === "not_allowed" ? 403 : code ? 422 : 500;
  return { error: code ?? "server_error", status };
}
