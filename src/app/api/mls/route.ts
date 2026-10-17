// GET /api/mls — Pulso del mercado MLS (+$1M) por barrio, y cómo se comparan las residencias de ARK Private.
// Las credenciales del MLS viven solo en el servidor (MLS_API_URL, MLS_API_TOKEN). Sin ellas responde con datos demo.
import { compareOffMarket, getMlsSnapshot } from "@/lib/mls";

export async function GET() {
  const snapshot = await getMlsSnapshot();
  return Response.json({ ...snapshot, offMarket: compareOffMarket(snapshot) });
}
