import "server-only";
// Pulso del mercado MLS para ARK Private.
// Con MLS_API_URL + MLS_API_TOKEN lee la API RESO Web API (OData) del MLS. Sin ellas, o si falla, usa datos demo.
import { residences } from "./private";

export type MarketStat = {
  hood: string;
  medianPrice: number;
  pricePerSqft: number;
  daysOnMarket: number;
  activeListings: number;
};

export type MlsSnapshot = { source: "live" | "demo"; updatedAt: string; market: MarketStat[] };

export type OffMarketCompare = {
  id: string;
  name: string;
  hood: string;
  fromUsd: number;
  pricePerSqft: number;
  mls: MarketStat | undefined;
};

// Códigos postales por barrio para filtrar la API del MLS.
const HOOD_ZIPS: Record<string, string[]> = {
  Brickell: ["33131", "33129"],
  "Key Biscayne": ["33149"],
  "Miami Beach": ["33139", "33140", "33141"],
  Edgewater: ["33137"],
  "Coral Gables": ["33134", "33146", "33143"],
  "Coconut Grove": ["33133"],
};

// Segmento de lujo: lo que compite con ARK Private.
const LUXURY_MIN = 1_000_000;

// Datos de demostración (ficticios), segmento +$1M.
const DEMO_MARKET: MarketStat[] = [
  { hood: "Brickell", medianPrice: 1_650_000, pricePerSqft: 1_050, daysOnMarket: 98, activeListings: 412 },
  { hood: "Key Biscayne", medianPrice: 3_900_000, pricePerSqft: 1_450, daysOnMarket: 121, activeListings: 96 },
  { hood: "Miami Beach", medianPrice: 4_800_000, pricePerSqft: 1_700, daysOnMarket: 134, activeListings: 520 },
  { hood: "Edgewater", medianPrice: 1_400_000, pricePerSqft: 950, daysOnMarket: 104, activeListings: 268 },
  { hood: "Coral Gables", medianPrice: 2_600_000, pricePerSqft: 820, daysOnMarket: 76, activeListings: 210 },
  { hood: "Coconut Grove", medianPrice: 3_100_000, pricePerSqft: 1_150, daysOnMarket: 88, activeListings: 132 },
];

// Precio y metraje de entrada de cada residencia ARK (demo).
const ARK_UNITS: Record<string, { fromUsd: number; sqft: number }> = {
  r1: { fromUsd: 3_200_000, sqft: 2_450 },
  r2: { fromUsd: 1_950_000, sqft: 1_820 },
  r3: { fromUsd: 7_500_000, sqft: 4_300 },
  r4: { fromUsd: 2_400_000, sqft: 2_600 },
  r5: { fromUsd: 12_000_000, sqft: 6_900 },
  r6: { fromUsd: 4_100_000, sqft: 3_400 },
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

type ResoProperty = { ListPrice?: number; LivingArea?: number; DaysOnMarket?: number };

async function fetchHood(base: string, token: string, hood: string, zips: string[]): Promise<MarketStat> {
  const zipFilter = zips.map((z) => `PostalCode eq '${z}'`).join(" or ");
  const query = new URLSearchParams({
    $filter: `StandardStatus eq 'Active' and ListPrice ge ${LUXURY_MIN} and (${zipFilter})`,
    $select: "ListPrice,LivingArea,DaysOnMarket",
    $top: "200",
  });
  const res = await fetch(`${base.replace(/\/$/, "")}/Property?${query}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`MLS ${res.status}`);
  const rows: ResoProperty[] = (await res.json()).value ?? [];
  const priced = rows.filter((r) => r.ListPrice);
  if (!priced.length) throw new Error(`MLS sin datos para ${hood}`);
  const ppsf = priced.filter((r) => r.LivingArea).map((r) => r.ListPrice! / r.LivingArea!);
  return {
    hood,
    medianPrice: median(priced.map((r) => r.ListPrice!)),
    pricePerSqft: ppsf.length ? Math.round(median(ppsf)) : 0,
    daysOnMarket: median(priced.map((r) => r.DaysOnMarket ?? 0)),
    activeListings: rows.length,
  };
}

export async function getMlsSnapshot(): Promise<MlsSnapshot> {
  const base = process.env.MLS_API_URL;
  const token = process.env.MLS_API_TOKEN;
  if (base && token) {
    try {
      const market = await Promise.all(Object.entries(HOOD_ZIPS).map(([hood, zips]) => fetchHood(base, token, hood, zips)));
      return { source: "live", updatedAt: new Date().toISOString(), market };
    } catch (e) {
      console.error("[mls] usando datos demo:", e instanceof Error ? e.message : e);
    }
  }
  return { source: "demo", updatedAt: new Date().toISOString(), market: DEMO_MARKET };
}

export function compareOffMarket(snapshot: MlsSnapshot): OffMarketCompare[] {
  return residences.map((r) => {
    const unit = ARK_UNITS[r.id] ?? { fromUsd: 0, sqft: 1 };
    return {
      id: r.id,
      name: r.name,
      hood: r.hood,
      fromUsd: unit.fromUsd,
      pricePerSqft: Math.round(unit.fromUsd / unit.sqft),
      mls: snapshot.market.find((m) => m.hood === r.hood),
    };
  });
}
