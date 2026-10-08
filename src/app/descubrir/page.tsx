import type { Metadata } from "next";
import { DiscoverGrid } from "@/components/discover-grid";
import { getContext, getDictionary } from "@/lib/i18n";
import { formatPrice, profiles } from "@/lib/mock-data";
import { recentProfiles } from "@/lib/profiles-db";
import { positions } from "@/lib/talent";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.discover };
}

export default async function DiscoverPage() {
  const { locale, t, level } = await getContext();
  const real = await recentProfiles(30);
  const all = [...real, ...profiles.filter((p) => !real.some((r) => r.handle === p.handle))];
  const items = all.map((p) => ({
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
  return <DiscoverGrid items={items} text={{ ...t.discover, talentTitle: t.talent.discoverTitle, talentSub: t.talent.discoverSub(positions.length), carsTitle: t.cars.discover, carsSub: t.cars.discoverSub, deliveryTitle: t.delivery.title, deliverySub: t.delivery.discoverSub }} vip={level === "vip"}
      promo={{
        title: t.money.promoteTitle,
        sub: t.money.promoteSub,
        rate: t.money.promoteRate,
        cta: t.money.promoteCta,
        done: t.money.promoteDone,
        options: [3, 7, 30].map((days) => ({ days, label: t.money.promotePrice(days, formatPrice(days * 9, locale)) })),
      }}
    />;
}
