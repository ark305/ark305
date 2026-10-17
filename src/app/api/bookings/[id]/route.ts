// Cancelar (cliente) o avanzar el estado (proveedor). Las reglas viven en las funciones SQL.
import { NextResponse, type NextRequest } from "next/server";
import { isUuid, rpcError } from "@/lib/booking";
import { supabaseReady } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["confirmed", "en_route", "arrived", "in_service", "done"];

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  if (!supabaseReady) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (!isUuid(id)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const call =
    body.action === "cancel"
      ? supabase.rpc("cancel_booking", { p_booking: id })
      : STATUSES.includes(body.status)
        ? supabase.rpc("set_booking_status", { p_booking: id, p_status: body.status })
        : null;
  if (!call) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { data, error } = await call;
  if (error) {
    const e = rpcError(error.message);
    return NextResponse.json({ error: e.error }, { status: e.status });
  }
  return NextResponse.json({ booking: data });
}
