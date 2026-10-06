import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseReady } from "@/lib/supabase/config";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/agency/click { profile_id, link_id } — tracking anónimo, fire-and-forget.
export async function POST(req: Request) {
  try {
    if (!supabaseReady) return NextResponse.json({ ok: false, reason: "db_off" });
    const body = (await req.json().catch(() => null)) as { profile_id?: string; link_id?: string } | null;
    const profile_id = body?.profile_id ?? "";
    const link_id = body?.link_id ?? "";
    if (!UUID.test(profile_id) || !UUID.test(link_id)) {
      return NextResponse.json({ ok: false, reason: "bad_input" }, { status: 400 });
    }
    const supabase = await createClient();
    const referrer = req.headers.get("referer")?.slice(0, 500) ?? null;
    const user_agent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
    const { error } = await supabase.from("agency_clicks").insert({ profile_id, link_id, referrer, user_agent });
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
