import "server-only";
import { archieReady } from "./config";
import { ArchieRequestError, gql } from "./gql";
import { getSession, type Session } from "./server";
import { demoAvailability, miamiInstant, miamiParts, SLOT_HOURS, SLOT_LEN_H, type Availability, type Booking, type BookingStatus, type ServiceType } from "@/lib/booking";

// Reservas en Archie: el catálogo es service_offering y cada reserva es una experience_booking.
// La disponibilidad son los horarios de cada servicio menos las reservas activas de su proveedor.
// Sin doble reserva: experience_booking.slot_key (proveedor|hora) es único en Archie.

export class BookingError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

const STATUS: Record<BookingStatus, string> = {
  requested: "REQUESTED",
  confirmed: "CONFIRMED",
  en_route: "EN_ROUTE",
  arrived: "ARRIVED",
  in_service: "IN_PROGRESS",
  done: "COMPLETED",
  cancelled: "CANCELLED",
};
const FLOW: BookingStatus[] = ["requested", "confirmed", "en_route", "arrived", "in_service", "done"];
const fromArchie = (s: string | null): BookingStatus => (Object.keys(STATUS) as BookingStatus[]).find((k) => STATUS[k] === s) ?? "requested";

const TYPE: Record<string, ServiceType> = { DRIVER: "driver", YACHT: "yacht", CHEF: "chef", VIDEOGRAPHER: "videographer", PHOTOGRAPHER: "photographer", CLEANER: "cleaning" };
const UNIT: Record<string, string> = { h: "hour", p: "person", f: "fixed", m: "month" };

type OfferingNode = { id: string; title: string; description: string | null; price: number; unit: string | null; category: string; providerId: string | null };
type BookingNode = { id: string; status: string | null; partySize: number | null; notes: string | null; price: number | null; startsAt: string; endsAt: string | null; serviceName: string | null; providerId: string | null; memberId: string | null; serviceOfferingId: string | null };
const BOOKING_FIELDS = "id status partySize notes price startsAt endsAt serviceName providerId memberId serviceOfferingId";

async function catalog(token?: string | null) {
  const [{ serviceOffering }, { provider }] = await Promise.all([
    gql<{ serviceOffering: { items: OfferingNode[] } }>(
      `{ serviceOffering(first: 100, filter: { isActive: { equals: true } }, orderBy: { position: ASC }) { items { id title description price unit category providerId } } }`,
      undefined,
      token,
    ),
    gql<{ provider: { items: { id: string; name: string }[] } }>(`{ provider(first: 200) { items { id name } } }`, undefined, token),
  ]);
  const names = new Map(provider.items.map((p) => [p.id, p.name]));
  return serviceOffering.items
    .filter((o) => TYPE[o.category] && o.providerId)
    .map((o) => ({ ...o, providerId: o.providerId!, providerName: names.get(o.providerId!) ?? o.title }));
}

// Reservas activas de un día (de todos los proveedores). Si el rol no puede leerlas, seguimos:
// el campo único slot_key igual impide la doble reserva al confirmar.
async function activeBookings(date: string, token?: string | null) {
  const from = miamiInstant(date, 0).toISOString();
  const to = new Date(miamiInstant(date, 0).getTime() + 30 * 3600_000).toISOString();
  try {
    const { experienceBooking } = await gql<{ experienceBooking: { items: BookingNode[] } }>(
      `{ experienceBooking(first: 500, filter: { startsAt: { gte: "${from}", lt: "${to}" } }) { items { ${BOOKING_FIELDS} } } }`,
      undefined,
      token,
    );
    return experienceBooking.items.filter((b) => b.status !== STATUS.cancelled);
  } catch (e) {
    console.error("archie bookings of day", e);
    return [];
  }
}

const overlaps = (b: BookingNode, providerId: string, start: Date) => {
  if (b.providerId !== providerId) return false;
  const bs = new Date(b.startsAt).getTime();
  const be = b.endsAt ? new Date(b.endsAt).getTime() : bs + SLOT_LEN_H * 3600_000;
  return bs < start.getTime() + SLOT_LEN_H * 3600_000 && be > start.getTime();
};

export async function availability(date: string): Promise<Availability> {
  if (!archieReady) return demoAvailability(date);
  try {
    const token = (await getSession())?.token;
    const [offerings, booked] = await Promise.all([catalog(token), activeBookings(date, token)]);
    if (!offerings.length) return demoAvailability(date);
    const now = Date.now();
    return {
      source: "live",
      date,
      services: offerings.map((o) => ({ id: o.id, name: o.title, type: TYPE[o.category], description: o.description ?? "", price: o.price, price_unit: UNIT[o.unit ?? ""] ?? "fixed", provider_name: o.providerName, rating: null })),
      slots: offerings.flatMap((o) =>
        SLOT_HOURS.map((h) => {
          const start = miamiInstant(date, h);
          const pad = String(h).padStart(2, "0");
          return {
            id: `${o.id}_${date}_${pad}`,
            service_id: o.id,
            date,
            start_time: `${pad}:00:00`,
            end_time: `${String(h + SLOT_LEN_H).padStart(2, "0")}:00:00`,
            available: start.getTime() > now && !booked.some((b) => overlaps(b, o.providerId, start)),
          };
        }),
      ),
    };
  } catch (e) {
    console.error("archie availability", e);
    return demoAvailability(date);
  }
}

async function me(): Promise<{ session: Session; memberId: string }> {
  if (!archieReady) throw new BookingError("not_configured", 503);
  const session = await getSession();
  if (!session) throw new BookingError("auth_required", 401);
  const { member } = await gql<{ member: { items: { id: string }[] } }>(
    `query($a: String) { member(first: 1, filter: { authId: { equals: $a } }) { items { id } } }`,
    { a: session.userId },
    session.token,
  );
  if (!member.items[0]) throw new BookingError("profile", 403);
  return { session, memberId: member.items[0].id };
}

function toBooking(b: BookingNode, names: Map<string, { name: string; type: ServiceType | null }>): Booking {
  const start = miamiParts(new Date(b.startsAt));
  const end = miamiParts(b.endsAt ? new Date(b.endsAt) : new Date(new Date(b.startsAt).getTime() + SLOT_LEN_H * 3600_000));
  const svc = b.serviceOfferingId ? names.get(b.serviceOfferingId) : undefined;
  return {
    id: b.id,
    status: fromArchie(b.status),
    guests: b.partySize ?? 1,
    notes: b.notes,
    price: b.price ?? 0,
    service_name: b.serviceName ?? svc?.name ?? "",
    type: svc?.type ?? null,
    provider_name: (b.providerId && names.get(`p:${b.providerId}`)?.name) || b.serviceName || "",
    date: start.date,
    start_time: start.time,
    end_time: end.time,
  };
}

export async function myBookings(): Promise<Booking[]> {
  const { session, memberId } = await me();
  const [{ experienceBooking }, offerings] = await Promise.all([
    gql<{ experienceBooking: { items: BookingNode[] } }>(
      `query($m: String) { experienceBooking(first: 20, filter: { memberId: { equals: $m } }, orderBy: { startsAt: DESC }) { items { ${BOOKING_FIELDS} } } }`,
      { m: memberId },
      session.token,
    ),
    catalog(session.token).catch(() => []),
  ]);
  const names = new Map<string, { name: string; type: ServiceType | null }>();
  for (const o of offerings) {
    names.set(o.id, { name: o.title, type: TYPE[o.category] });
    names.set(`p:${o.providerId}`, { name: o.providerName, type: null });
  }
  return experienceBooking.items.map((b) => toBooking(b, names));
}

const SLOT_RE = /^([0-9a-zA-Z-]{8,64})_(\d{4}-\d{2}-\d{2})_(\d{2})$/;

export async function book(slotId: unknown, guestsIn: unknown, notesIn: unknown) {
  const m = typeof slotId === "string" ? slotId.match(SLOT_RE) : null;
  if (!m || !SLOT_HOURS.includes(Number(m[3]))) throw new BookingError("bad_request", 400);
  const guests = Number.isInteger(guestsIn) ? Math.max(1, Math.min(50, guestsIn as number)) : 1;
  const notes = typeof notesIn === "string" && notesIn.trim() ? notesIn.trim().slice(0, 500) : null;
  const { session, memberId } = await me();

  const { serviceOffering } = await gql<{ serviceOffering: { items: OfferingNode[] } }>(
    `query($id: String) { serviceOffering(first: 1, filter: { id: { equals: $id }, isActive: { equals: true } }) { items { id title description price unit category providerId } } }`,
    { id: m[1] },
    session.token,
  );
  const o = serviceOffering.items[0];
  if (!o?.providerId || !TYPE[o.category]) throw new BookingError("bad_request", 400);
  const start = miamiInstant(m[2], Number(m[3]));
  if (start.getTime() <= Date.now()) throw new BookingError("slot_taken", 409);
  if ((await activeBookings(m[2], session.token)).some((b) => overlaps(b, o.providerId!, start))) throw new BookingError("slot_taken", 409);

  const price = o.unit === "h" ? o.price * SLOT_LEN_H : o.unit === "p" ? o.price * guests : o.price;
  try {
    const { createExperienceBooking } = await gql<{ createExperienceBooking: { id: string } }>(
      `mutation($in: ExperienceBookingCreateInput!) { createExperienceBooking(input: $in) { id } }`,
      {
        in: {
          serviceName: o.title,
          serviceOrder: 1,
          startsAt: start.toISOString(),
          endsAt: new Date(start.getTime() + SLOT_LEN_H * 3600_000).toISOString(),
          partySize: guests,
          price,
          status: STATUS.requested,
          instantConfirmed: false,
          notes,
          slotKey: `${o.providerId}|${start.toISOString()}`,
          member: { connect: { id: memberId } },
          provider: { connect: { id: o.providerId } },
          serviceOffering: { connect: { id: o.id } },
        },
      },
      session.token,
    );
    return { id: createExperienceBooking.id };
  } catch (e) {
    if (e instanceof ArchieRequestError && /unique|duplicate|already exists/i.test(e.message)) throw new BookingError("slot_taken", 409);
    throw e;
  }
}

// Cancelar (la persona que reservó, mientras esté solicitada o confirmada) o avanzar el estado
// (el proveedor de esa reserva, solo hacia adelante).
export async function updateBooking(id: string, action: unknown, statusIn: unknown) {
  const { session, memberId } = await me();
  const { experienceBooking } = await gql<{ experienceBooking: { items: BookingNode[] } }>(
    `query($id: String) { experienceBooking(first: 1, filter: { id: { equals: $id } }) { items { ${BOOKING_FIELDS} } } }`,
    { id },
    session.token,
  );
  const b = experienceBooking.items[0];
  if (!b) throw new BookingError("not_allowed", 403);
  const current = fromArchie(b.status);

  let input: Record<string, unknown>;
  if (action === "cancel") {
    if (b.memberId !== memberId || !(current === "requested" || current === "confirmed")) throw new BookingError("not_cancellable", 422);
    input = { status: STATUS.cancelled, slotKey: null };
  } else if (typeof statusIn === "string" && FLOW.includes(statusIn as BookingStatus)) {
    const { provider } = await gql<{ provider: { items: { id: string }[] } }>(
      `query($m: String) { provider(first: 1, filter: { memberId: { equals: $m } }) { items { id } } }`,
      { m: memberId },
      session.token,
    );
    if (!provider.items[0] || provider.items[0].id !== b.providerId) throw new BookingError("not_allowed", 403);
    if (current === "cancelled" || FLOW.indexOf(statusIn as BookingStatus) <= FLOW.indexOf(current)) throw new BookingError("bad_transition", 422);
    input = { status: STATUS[statusIn as BookingStatus] };
  } else throw new BookingError("bad_request", 400);

  await gql(`mutation($id: String, $in: ExperienceBookingUpdateInput!) { updateExperienceBooking(id: $id, input: $in) { id } }`, { id, in: input }, session.token);
  return { id, status: fromArchie(String(input.status)) };
}
