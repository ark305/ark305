import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Enlace del correo de Supabase (solo para reservas): abre la sesión y vuelve a /reservar.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/reservar";
  if (!code) return NextResponse.redirect(`${origin}${safeNext}?error=link`);
  const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(`${origin}${safeNext}${error ? "?error=link" : ""}`);
}
