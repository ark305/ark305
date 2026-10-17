// POST /api/video/lead — reserva o solicitud de un videógrafo desde el evento.
// 1) GoHighLevel (Inbound Webhook de un workflow), 2) Supabase (tabla event_leads), o ambos.
// Si ninguno está configurado, responde delivered: [] y el teléfono guarda el lead localmente.
import { NextResponse } from "next/server";
import { getVideoPackage, getVideographer } from "@/lib/video";

const clean = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (clean(b.company)) return NextResponse.json({ ok: true, delivered: [] }); // honeypot anti-bots

  const name = clean(b.name, 80);
  const email = clean(b.email, 120).toLowerCase();
  const phone = clean(b.phone, 30);
  if (!name || (!/^\S+@\S+\.\S+$/.test(email) && phone.replace(/\D/g, "").length < 7))
    return NextResponse.json({ error: "contact" }, { status: 400 });

  const vg = getVideographer(clean(b.videographerId, 40));
  const pkg = getVideoPackage(clean(b.packageId, 20));
  const lead = {
    name,
    email: email || null,
    phone: phone || null,
    instagram: clean(b.instagram, 60) || null,
    videographer: vg?.name ?? null,
    package: pkg?.name.en ?? null,
    price: pkg?.price ?? null,
    slot: clean(b.slot, 10) || null,
    brief: clean(b.brief, 800) || null,
    plan_title: clean(b.planTitle, 120) || null,
    locale: b.locale === "en" ? "en" : "es",
    source: clean(b.source, 40) || "ark-video",
  };

  const delivered: string[] = [];
  const [first, ...rest] = name.split(" ");

  const ghl = process.env.GHL_WEBHOOK_URL;
  if (ghl) {
    try {
      const r = await fetch(ghl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...lead,
          first_name: first,
          last_name: rest.join(" "),
          full_name: name,
          tags: ["ark-video", lead.source, vg ? `videographer:${vg.id}` : "", pkg ? `package:${pkg.id}` : ""].filter(Boolean),
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) delivered.push("ghl");
      else console.error("ghl", r.status);
    } catch (e) {
      console.error("ghl", e);
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const r = await fetch(`${url}/rest/v1/event_leads`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) delivered.push("supabase");
      else console.error("supabase event_leads", r.status);
    } catch (e) {
      console.error("supabase event_leads", e);
    }
  }

  return NextResponse.json({ ok: true, delivered });
}
