import { NextResponse, type NextRequest } from "next/server";

// Los perfiles públicos viven en ark305.com/@usuario.
// Next.js reserva las carpetas con "@", así que por dentro los servimos desde /u/usuario.
// (La sesión ya no se renueva aquí: el SDK de Archie la renueva en el navegador.)
export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/@([a-z0-9._]{2,30})\/?$/i);
  if (!match) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/u/${match[1].toLowerCase()}`, request.url));
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
