import { NextResponse, type NextRequest } from "next/server";

// Los perfiles públicos viven en ark305.com/@usuario.
// Next.js reserva las carpetas con "@", así que por dentro los servimos desde /u/usuario.
export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/@([a-z0-9._]{2,30})\/?$/i);
  if (!match) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/u/${match[1].toLowerCase()}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
