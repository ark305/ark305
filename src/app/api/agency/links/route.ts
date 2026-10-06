import { NextResponse } from "next/server";
import { getAgencyProfileLinks } from "@/lib/agency";

// GET /api/agency/links?profile_id=… — links de un perfil (panel).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profile_id = searchParams.get("profile_id") ?? "";
  if (!profile_id) return NextResponse.json({ links: [] });
  const links = await getAgencyProfileLinks(profile_id);
  return NextResponse.json({ links });
}
