// Disponibilidad pública de servicios para un día. Sin Supabase (o si falla): catálogo demo.
import { NextResponse, type NextRequest } from "next/server";
import { demoAvailability, isDate, miamiDate, type Availability } from "@/lib/booking";
import { supabaseReady } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("date");
  const date = isDate(q) ? q : miamiDate();
  if (!supabaseReady) return NextResponse.json(demoAvailability(date));

  const supabase = await createClient();
  const [services, slots] = await Promise.all([
    supabase.from("catalog_services").select("id,name,type,description,price,price_unit,provider_name,rating").order("price", { ascending: false }),
    supabase.from("availability_slots").select("id,service_id,date,start_time,end_time,available").eq("date", date).order("start_time"),
  ]);
  if (services.error || slots.error || !services.data?.length) return NextResponse.json(demoAvailability(date));
  const body: Availability = { source: "live", date, services: services.data, slots: slots.data ?? [] };
  return NextResponse.json(body);
}
