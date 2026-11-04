import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from "@/lib/supabase/config";

// 1. Los perfiles públicos viven en ark305.com/@usuario.
//    Next.js reserva las carpetas con "@", así que por dentro los servimos desde /u/usuario.
// 2. Renueva la sesión de Supabase en cada visita para que no se cierre sola.
export async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/@([a-z0-9._]{2,30})\/?$/i);
  const rewriteTo = match ? new URL(`/u/${match[1].toLowerCase()}`, request.url) : null;
  const respond = () => (rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request }));

  let response = respond();
  if (!supabaseReady) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = respond();
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
