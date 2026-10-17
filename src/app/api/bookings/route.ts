// Reservas de la persona conectada (Archie). Reservar bloquea el horario: slot_key es único en Archie.
import { NextResponse } from "next/server";
import { book, BookingError, myBookings } from "@/lib/archie/bookings";

const fail = (e: unknown) => {
  if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: e.status });
  console.error("bookings", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
};

export async function GET() {
  try {
    return NextResponse.json({ bookings: await myBookings() });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json({ booking: await book(body.slotId, body.guests, body.notes) }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
