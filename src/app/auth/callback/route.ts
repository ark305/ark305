import { NextResponse, type NextRequest } from "next/server";
import { safeLocalNext } from "@/lib/auth-flow";
import { createClient } from "@/lib/supabase/server";

const SET_PASSWORD = "/crear-contrasena";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const purpose = searchParams.get("purpose");
  const requestedNext = searchParams.get("next");
  const next = requestedNext === null ? "/diagnostico" : safeLocalNext(requestedNext);

  if (!code || (purpose && purpose !== "setup" && purpose !== "recovery")) {
    return NextResponse.redirect(`${origin}/entrar?error=link`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/entrar?error=link`);

  if (purpose === "setup") return NextResponse.redirect(`${origin}${SET_PASSWORD}?purpose=setup`);
  if (purpose === "recovery") return NextResponse.redirect(`${origin}${SET_PASSWORD}?purpose=recovery`);

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  return NextResponse.redirect(`${origin}${profile ? next : "/bienvenida"}`);
}
