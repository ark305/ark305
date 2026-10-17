// Reservas de la persona conectada. Reservar pasa por la función SQL book_slot (atómica, sin doble reserva).
import { NextResponse } from "next/server";
import { isUuid, rpcError } from "@/lib/booking";
import { supabaseReady } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const FIELDS = "id,status,guests,notes,price,price_unit,created_at,catalog_services(name,type,provider_name),availability_slots(date,start_time,end_time)";

export async function GET() {
  if (!supabaseReady) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  const { data, error } = await supabase.from("bookings").select(FIELDS).eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

export async function POST(req: Request) {
  if (!supabaseReady) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!isUuid(body.slotId)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const guests = Number.isInteger(body.guests) ? body.guests : 1;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { data, error } = await supabase.rpc("book_slot", { p_slot: body.slotId, p_guests: guests, p_notes: notes });
  if (error) {
    const e = rpcError(error.message);
    return NextResponse.json({ error: e.error }, { status: e.status });
  }
  const { data: booking } = await supabase.from("bookings").select(FIELDS).eq("id", data.id).single();
  return NextResponse.json({ booking: booking ?? data }, { status: 201 });
}
