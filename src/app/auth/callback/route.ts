import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// El enlace del correo llega aquí: abrimos la sesión y mandamos a la persona a su perfil
// (o a crear su perfil si es la primera vez).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/perfil";

  if (!code) return NextResponse.redirect(`${origin}/entrar?error=link`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/entrar?error=link`);

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  return NextResponse.redirect(`${origin}${profile ? safeNext : "/bienvenida"}`);
}
