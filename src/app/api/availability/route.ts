// Disponibilidad pública de servicios para un día (Archie). Sin Archie (o si falla): catálogo demo.
import { NextResponse, type NextRequest } from "next/server";
import { availability } from "@/lib/archie/bookings";
import { isDate, miamiDate } from "@/lib/booking";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("date");
  return NextResponse.json(await availability(isDate(q) ? q : miamiDate()));
}
