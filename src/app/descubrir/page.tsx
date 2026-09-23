import type { Metadata } from "next";
import { DiscoverGrid } from "@/components/discover-grid";
import { getContext, getDictionary } from "@/lib/i18n";
import { profiles } from "@/lib/mock-data";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.discover };
}

export default async function DiscoverPage() {
  const { locale, t, level } = await getContext();
  const items = profiles.map((p) => ({
    handle: p.handle,
    name: p.name,
    role: p.role[locale],
    area: p.area,
    kind: p.kind,
    kindLabel: t.kinds[p.kind],
    private: !!p.private,
    near: p.near,
    photo: p.photo,
  }));
  return <DiscoverGrid items={items} text={t.discover} vip={level === "vip"} />;
}
