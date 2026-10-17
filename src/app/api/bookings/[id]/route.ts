// Cancelar (cliente) o avanzar el estado (proveedor). Las reglas viven en src/lib/archie/bookings.ts.
import { NextResponse, type NextRequest } from "next/server";
import { BookingError, updateBooking } from "@/lib/archie/bookings";
import { isId } from "@/lib/booking";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json({ booking: await updateBooking(id, body.action, body.status) });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: e.status });
    console.error("booking update", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
