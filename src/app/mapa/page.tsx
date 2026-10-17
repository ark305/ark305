import type { Metadata } from "next";
import Link from "next/link";
import { ArkMapLazy } from "@/components/ark-map-lazy";
import { getContext, getDictionary } from "@/lib/i18n";
import { SERVICE_TYPES, type ServiceType } from "@/lib/booking";
import { MAP_KINDS, mapNodes, type MapKind } from "@/lib/map";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.map.title };
}

// Mapa ARK: la red de nodos sobre Miami y el seguimiento en vivo de un servicio (demo).
export default async function MapPage({ searchParams }: PageProps<"/mapa">) {
  const { locale, t } = await getContext();
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const capa = one(q.capa);
  const servicio = one(q.servicio) ?? one(q.tipo);
  const initial = {
    kinds: capa ? capa.split(",").filter((k): k is MapKind => (MAP_KINDS as string[]).includes(k)) : undefined,
    zone: one(q.zona),
    service: SERVICE_TYPES.includes(servicio as ServiceType) ? (servicio as ServiceType) : undefined,
  };
  const m = t.map;
  const count = (k: string) => mapNodes.filter((n) => n.kind === k).length;

  return (
    <div className="flex flex-col gap-5 px-5 pt-8">
      <div>
        <p className="text-[12px] font-bold tracking-[0.14em] text-gold-soft uppercase">{m.badge}</p>
        <h1 className="mt-1 font-display text-[34px] leading-[1.05] font-semibold text-white">{m.title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-cream/80">{m.intro}</p>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {MAP_KINDS.map((k) => (
          <div key={k} className="rounded-2xl border border-white/[0.08] bg-card px-1 py-3">
            <p className="text-2xl font-bold text-white">{count(k)}</p>
            <p className="text-[10px] leading-tight text-mute">{m.filters[k]}</p>
          </div>
        ))}
      </div>
      <ArkMapLazy labels={{ filters: m.filters, track: m.track, ui: m.ui }} locale={locale} initial={initial} />
      <div className="rounded-[22px] border border-white/[0.08] bg-card p-4">
        <p className="text-[15px] font-bold text-white">{m.gpsTitle}</p>
        <p className="mt-1 text-[13px] leading-snug text-cream/75">{m.gpsBody}</p>
      </div>
      <Link href="/developers" className="text-center text-[13px] font-bold text-gold-soft">
        {m.toDevelopers}
      </Link>
      <p className="text-center text-[11px] text-mute">{m.demoNote}</p>
    </div>
  );
}
