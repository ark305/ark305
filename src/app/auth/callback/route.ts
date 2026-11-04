import { NextResponse, type NextRequest } from "next/server";
import { backendApi } from "@/lib/backend-api";
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

  try {
    if (!data.session?.access_token) throw new Error("Missing session");
    const viewer = await backendApi<{ row: { id: string } | null }>("/profiles/me", {
      token: data.session.access_token,
    });
    return NextResponse.redirect(`${origin}${viewer.row ? next : "/bienvenida"}`);
  } catch {
    return Response.json({ error: "backend_unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
