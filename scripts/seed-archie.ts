// Carga en Archie los datos de ejemplo del repo (perfiles, proveedores, servicios, días armados, eventos y niveles),
// marcados con is_demo_data = true para poder borrarlos fácil después.
//
// Antes: agrega en Archie los campos de docs/archie-setup.md.
// Uso:
//   ARCHIE_SEED_KEY="<llave de API con rol Operator (Admin)>" npx tsx scripts/seed-archie.ts
// Se puede correr más de una vez: salta lo que ya existe (por handle o por slug).
import { profiles } from "../src/lib/mock-data";
import { catalog, packages, type Unit } from "../src/lib/catalog";
import { events } from "../src/lib/community";
import { levels } from "../src/lib/levels";
import type { ServiceCategory } from "../src/lib/archie/categories";

const API = (process.env.NEXT_PUBLIC_ARCHIE_API_URL || "https://archie-core.services.archie.com").replace(/\/+$/, "");
const PROJECT = process.env.NEXT_PUBLIC_ARCHIE_PROJECT_ID || "a9726866-7936-4111-8505-9093aba8f639";
const ENV = process.env.NEXT_PUBLIC_ARCHIE_ENVIRONMENT || "master";
const KEY = process.env.ARCHIE_SEED_KEY;
if (!KEY) {
  console.error("Falta ARCHIE_SEED_KEY (llave de API de Archie con rol de administrador).");
  process.exit(1);
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-project-id": PROJECT, environment: ENV, Authorization: KEY! },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || body.errors?.length) throw new Error(body.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`);
  return body.data as T;
}

// Archie solo tiene 7 categorías de servicio; cada servicio del catálogo va a la más cercana.
const CATEGORY: Record<string, ServiceCategory> = {
  suv: "DRIVER", airport: "DRIVER", heli: "DRIVER",
  yacht: "YACHT", catamaran: "YACHT", jetski: "YACHT",
  chef: "CHEF", brunch: "CHEF", bottles: "CHEF", restaurant: "CHEF", vipTable: "CHEF",
  turnover: "CLEANER", villa: "CLEANER",
  photographer: "PHOTOGRAPHER", drone: "VIDEOGRAPHER", reel: "VIDEOGRAPHER", shoot: "VIDEOGRAPHER", edit30: "VIDEOGRAPHER",
};
const DURATION: Record<Unit, number | null> = { h: 60, p: null, f: null, m: null };

async function main() {
  // ---------- Perfiles (member) ----------
  const memberIds = new Map<string, string>();
  const existing = await gql<{ member: { items: { id: string; handle: string | null }[] } }>(`{ member(first: 500) { items { id handle } } }`);
  for (const m of existing.member.items) if (m.handle) memberIds.set(m.handle, m.id);

  for (const p of profiles) {
    if (memberIds.has(p.handle)) continue;
    const { createMember } = await gql<{ createMember: { id: string } }>(`mutation($in: MemberCreateInput!) { createMember(input: $in) { id } }`, {
      in: {
        fullName: p.name,
        email: `${p.handle}@demo.ark305.com`,
        tier: "PLAYGROUND",
        status: "ACTIVE",
        dues: 0,
        language: "ES",
        handle: p.handle,
        kind: p.kind,
        role: p.role.es,
        roleEn: p.role.en,
        area: p.area,
        tagline: p.tagline.es,
        taglineEn: p.tagline.en,
        photoUrl: p.photo,
        bannerUrl: p.banner,
        gallery: p.posts,
        followers: p.followers,
        near: p.near,
        isPrivate: !!p.private,
        isDemoData: true,
      },
    });
    memberIds.set(p.handle, createMember.id);
    console.log("member", p.handle);
  }

  // ---------- Proveedores (provider), uno por perfil que ofrece algo ----------
  const providerIds = new Map<string, string>();
  const provs = await gql<{ provider: { items: { id: string; memberId: string | null }[] } }>(`{ provider(first: 500) { items { id memberId } } }`);
  const handleOf = new Map([...memberIds].map(([h, id]) => [id, h]));
  for (const pr of provs.provider.items) if (pr.memberId && handleOf.has(pr.memberId)) providerIds.set(handleOf.get(pr.memberId)!, pr.id);

  const offering = new Set([...catalog.map((c) => c.provider), ...profiles.filter((p) => p.services.length).map((p) => p.handle)]);
  for (const handle of offering) {
    if (providerIds.has(handle)) continue;
    const p = profiles.find((x) => x.handle === handle)!;
    const items = catalog.filter((c) => c.provider === handle);
    const { createProviderMany } = await gql<{ createProviderMany: { createdIds: string[] | null } }>(
      `mutation($in: [ProviderCreateInput!]!) { createProviderMany(inputs: $in, transactionMode: ALL_OR_NOTHING) { createdIds } }`,
      {
        in: [
          {
            name: p.name,
            category: CATEGORY[items[0]?.id ?? ""] ?? "PHOTOGRAPHER",
            bio: p.tagline.es,
            neighborhood: p.area,
            startingPrice: items.length ? Math.min(...items.map((i) => i.price)) : null,
            status: "ACTIVE",
            isDemoData: true,
            member: { connect: { id: memberIds.get(handle) } },
          },
        ],
      },
    );
    providerIds.set(handle, createProviderMany.createdIds![0]);
    console.log("provider", handle);
  }

  // ---------- Servicios (service_offering) ----------
  const slugIds = new Map<string, string>();
  const offs = await gql<{ serviceOffering: { items: { id: string; slug: string | null }[] } }>(`{ serviceOffering(first: 500) { items { id slug } } }`);
  for (const o of offs.serviceOffering.items) if (o.slug) slugIds.set(o.slug, o.id);

  const create = async (slug: string, input: Record<string, unknown>, handle: string) => {
    if (slugIds.has(slug)) return;
    const { createServiceOffering } = await gql<{ createServiceOffering: { id: string } }>(
      `mutation($in: ServiceOfferingCreateInput!) { createServiceOffering(input: $in) { id } }`,
      { in: { ...input, slug, isActive: true, isDemoData: true, provider: { connect: { id: providerIds.get(handle) } } } },
    );
    slugIds.set(slug, createServiceOffering.id);
    console.log("service", slug);
  };

  // Catálogo de "Mi día" (el slug es el id que usa el front).
  for (const [i, c] of catalog.entries()) {
    await create(
      c.id,
      {
        title: c.name.es,
        titleEn: c.name.en,
        description: c.desc.es,
        descriptionEn: c.desc.en,
        category: CATEGORY[c.id] ?? "PHOTOGRAPHER",
        price: c.price,
        unit: c.unit,
        hours: c.hours ?? null,
        outing: c.outing,
        durationMinutes: DURATION[c.unit],
        photoUrl: c.photo,
        action: "book",
        position: i,
      },
      c.provider,
    );
  }
  // Vitrina de los perfiles de ejemplo (Lente 305).
  for (const p of profiles) {
    for (const [i, s] of p.services.entries()) {
      await create(
        `${p.handle}-${s.id}`,
        {
          title: s.title.es,
          titleEn: s.title.en,
          kicker: s.kicker.es,
          kickerEn: s.kicker.en,
          detail: s.detail.es,
          detailEn: s.detail.en,
          category: "PHOTOGRAPHER",
          price: s.price,
          action: s.action,
          photoUrl: s.photo,
          position: 100 + i,
        },
        p.handle,
      );
    }
  }

  // ---------- Días armados (experience_package) ----------
  const pkgs = await gql<{ experiencePackage: { items: { slug: string | null }[] } }>(`{ experiencePackage(first: 100) { items { slug } } }`);
  const havePkg = new Set(pkgs.experiencePackage.items.map((p) => p.slug));
  for (const pk of packages) {
    if (havePkg.has(pk.id)) continue;
    const price = pk.items.reduce((sum, it) => {
      const c = catalog.find((x) => x.id === it.id)!;
      return sum + (c.unit === "h" ? c.price * it.qty : c.unit === "p" ? c.price * 4 : c.price);
    }, 0);
    const { createExperiencePackage } = await gql<{ createExperiencePackage: { id: string } }>(
      `mutation($in: ExperiencePackageCreateInput!) { createExperiencePackage(input: $in) { id } }`,
      { in: { title: pk.name.es, titleEn: pk.name.en, description: pk.desc.es, descriptionEn: pk.desc.en, slug: pk.id, price, guestCapacity: 4, status: "PROPOSED", photoUrl: pk.photo, items: pk.items, isDemoData: true } },
    );
    for (const it of pk.items) {
      await gql(`mutation($in: ExperiencePackageServiceOfferingCreateInput!) { createExperiencePackageServiceOffering(input: $in) { id } }`, {
        in: { experiencePackage: { connect: { id: createExperiencePackage.id } }, serviceOffering: { connect: { id: slugIds.get(it.id) } } },
      });
    }
    console.log("package", pk.id);
  }

  // ---------- Eventos (event): las próximas fechas de cada uno ----------
  const evs = await gql<{ event: { items: { slug: string | null }[] } }>(`{ event(first: 100) { items { slug } } }`);
  const haveEv = new Set(evs.event.items.map((e) => e.slug));
  const when: Record<string, { day: number; hour: number; category: string }> = {
    sail: { day: 4, hour: 18, category: "SPORTS" },
    brunch: { day: 6, hour: 11, category: "DINING" },
    night: { day: 1, hour: 22, category: "MUSIC" },
  };
  for (const e of events) {
    if (haveEv.has(e.id)) continue;
    const w = when[e.id] ?? { day: 6, hour: 18, category: "ART" };
    const d = new Date();
    d.setDate(d.getDate() + ((w.day - d.getDay() + 7) % 7 || 7));
    d.setHours(w.hour, 0, 0, 0);
    await gql(`mutation($in: EventCreateInput!) { createEvent(input: $in) { id } }`, {
      in: { title: e.name.es, titleEn: e.name.en, slug: e.id, venue: e.place, startsAt: d.toISOString(), category: w.category, photoUrl: e.photo, going: e.going, isDemoData: true },
    });
    console.log("event", e.id);
  }

  // ---------- Niveles (plan) ----------
  const plans = await gql<{ plan: { items: { slug: string | null }[] } }>(`{ plan(first: 20) { items { slug } } }`);
  const havePlan = new Set(plans.plan.items.map((p) => p.slug));
  const PRICE: Record<string, number> = { personal: 0, business: 79, vip: 2500 };
  for (const l of levels) {
    if (havePlan.has(l.id)) continue;
    await gql(`mutation($in: PlanCreateInput!) { createPlan(input: $in) { id } }`, {
      in: { name: l.name.es, nameEn: l.name.en, slug: l.id, price: PRICE[l.id], interval: "MONTH", features: [...l.buscar, ...l.ofrecer, ...(l.extra ?? [])].map((f) => f.es).join("\n"), isDemoData: true },
    });
    console.log("plan", l.id);
  }

  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
