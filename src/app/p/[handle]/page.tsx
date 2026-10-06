import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TrackLink } from "@/components/agency/track-link";
import { detectPlatform, PlatformGlyph } from "@/components/agency/social-icons";
import { getAgencyProfile, type AgencyLink } from "@/lib/agency";

// Página pública del perfil: /p/itakaark — estilo Linkme, mobile-first, cine oscuro.
export async function generateMetadata({ params }: PageProps<"/p/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getAgencyProfile(handle);
  if (!profile) return {};
  return {
    title: `${profile.display_name} · ARK305`,
    description: profile.bio,
    openGraph: profile.avatar_url ? { images: [profile.avatar_url] } : undefined,
  };
}

const SECTION_TITLES: Record<string, string> = {
  redes: "CUENTAS",
  destacado: "DESTACADO",
  productos: "PRODUCTOS",
  herramientas: "HERRAMIENTAS",
};

function sectionTitle(s: string) {
  return SECTION_TITLES[s] ?? s.toUpperCase();
}

function MainPlatforms({ links }: { links: AgencyLink[] }) {
  // Las 3 plataformas principales: primer Instagram personal, TikTok y YouTube.
  const picks: AgencyLink[] = [];
  const ig = links.find((l) => l.url.includes("instagram.com/itakaark"));
  const tk = links.find((l) => l.url.includes("tiktok.com"));
  const yt = links.find((l) => l.url.includes("youtube.com"));
  if (ig) picks.push(ig);
  if (tk) picks.push(tk);
  if (yt) picks.push(yt);
  return picks;
}

export default async function AgencyProfilePage({ params }: PageProps<"/p/[handle]">) {
  const { handle } = await params;
  const profile = await getAgencyProfile(handle);
  if (!profile) notFound();

  const { links } = profile;
  const mains = MainPlatforms({ links });
  const featured = links.find((l) => l.section === "destacado");
  const socials = links.filter((l) => l.kind === "social");
  const products = links.filter((l) => l.kind === "product" && l.section !== "destacado");
  const tools = links.filter((l) => l.kind === "link");

  return (
    <main className="min-h-dvh bg-ink text-cream">
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-12">
        {/* HERO — tarjeta de perfil */}
        <section className="overflow-hidden rounded-3xl border border-line bg-card">
          <div className="relative h-56 w-full">
            {profile.cover_url ? (
              <Image
                src={profile.cover_url}
                alt=""
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#2a2c33_0%,#08090b_70%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              {profile.avatar_url && (
                <span className="mb-3 block size-16 overflow-hidden rounded-full border-2 border-cream/20">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    width={64}
                    height={64}
                    className="size-full object-cover"
                  />
                </span>
              )}
              <h1 className="font-display text-3xl font-bold tracking-tight">{profile.display_name}</h1>
              {profile.bio && <p className="mt-1 text-sm text-mute">{profile.bio}</p>}
            </div>
          </div>
          {/* Iconos circulares */}
          {mains.length > 0 && (
            <div className="flex items-center justify-center gap-4 px-5 py-5">
              {mains.map((l) => (
                <TrackLink
                  key={l.id}
                  profileId={profile.id}
                  linkId={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={l.title}
                  className="flex size-12 items-center justify-center rounded-full border border-line-2 bg-raised text-cream transition hover:border-gold hover:text-gold"
                >
                  <PlatformGlyph platform={detectPlatform(l.url)} />
                </TrackLink>
              ))}
            </div>
          )}
        </section>

        {/* PLATAFORMAS — grid de imagen */}
        {mains.length > 0 && (
          <section className="mt-8" aria-label="Plataformas">
            <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-dim">PLATAFORMAS</h2>
            <div className="grid grid-cols-2 gap-3">
              {mains.map((l, i) => (
                <TrackLink
                  key={l.id}
                  profileId={profile.id}
                  linkId={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={l.title}
                  className={`relative block overflow-hidden rounded-2xl border border-line bg-card ${
                    i === 0 ? "col-span-2 h-40" : "h-36"
                  }`}
                >
                  {profile.avatar_url && (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      fill
                      sizes="(max-width: 448px) 50vw, 224px"
                      loading="lazy"
                      className="object-cover"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                    <PlatformGlyph platform={detectPlatform(l.url)} className="size-4" />
                  </span>
                  <span className="absolute bottom-3 left-4 font-display text-xl font-bold">
                    {detectPlatform(l.url) === "instagram"
                      ? "Instagram"
                      : detectPlatform(l.url) === "tiktok"
                        ? "TikTok"
                        : "YouTube"}
                  </span>
                </TrackLink>
              ))}
            </div>
          </section>
        )}

        {/* DESTACADO */}
        {featured && (
          <section className="mt-8" aria-label="Destacado">
            <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-dim">DESTACADO</h2>
            <TrackLink
              profileId={profile.id}
              linkId={featured.id}
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl border border-gold/40 bg-card transition hover:border-gold"
            >
              {featured.image_url && (
                <span className="relative block h-44 w-full">
                  <Image
                    src={featured.image_url}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 448px) 100vw, 448px"
                    loading="lazy"
                    className="object-cover"
                  />
                </span>
              )}
              <span className="flex items-center justify-between gap-3 p-4">
                <span>
                  <span className="block font-semibold">{featured.title}</span>
                  {featured.subtitle && <span className="block text-sm text-mute">{featured.subtitle}</span>}
                </span>
                <span className="gold-grad shrink-0 rounded-full px-4 py-2 text-sm font-bold text-ink">Ver</span>
              </span>
            </TrackLink>
          </section>
        )}

        {/* PRODUCTOS */}
        {products.length > 0 && (
          <section className="mt-8" aria-label="Productos">
            <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-dim">PRODUCTOS</h2>
            <div className="flex flex-col gap-2.5">
              {products.map((l) => (
                <TrackLink
                  key={l.id}
                  profileId={profile.id}
                  linkId={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 transition hover:border-gold/60"
                >
                  <span>
                    <span className="block font-semibold">{l.title}</span>
                    {l.subtitle && <span className="block text-sm text-mute">{l.subtitle}</span>}
                  </span>
                  <span aria-hidden className="text-gold">→</span>
                </TrackLink>
              ))}
            </div>
          </section>
        )}

        {/* HERRAMIENTAS */}
        {tools.length > 0 && (
          <section className="mt-8" aria-label="Herramientas">
            <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-dim">HERRAMIENTAS</h2>
            <div className="flex flex-col gap-2.5">
              {tools.map((l) => (
                <TrackLink
                  key={l.id}
                  profileId={profile.id}
                  linkId={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-raised px-4 py-3.5 transition hover:border-gold/60"
                >
                  <span>
                    <span className="block font-semibold">{l.title}</span>
                    {l.subtitle && <span className="block text-sm text-mute">{l.subtitle}</span>}
                  </span>
                  <span aria-hidden className="text-gold">→</span>
                </TrackLink>
              ))}
            </div>
          </section>
        )}

        {/* CUENTAS */}
        {socials.length > 0 && (
          <section className="mt-8" aria-label="Cuentas">
            <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-dim">{sectionTitle("redes")}</h2>
            <div className="flex flex-col gap-2">
              {socials.map((l) => (
                <TrackLink
                  key={l.id}
                  profileId={profile.id}
                  linkId={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${l.title} en ${l.subtitle}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-ink-2 px-4 py-3 transition hover:border-gold/60"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-raised text-cream">
                    <PlatformGlyph platform={detectPlatform(l.url)} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{l.title}</span>
                    {l.subtitle && <span className="block text-xs text-mute">{l.subtitle}</span>}
                  </span>
                  <span className="ml-auto shrink-0 rounded-full border border-line-2 px-3 py-1 text-xs font-semibold text-mute">
                    Seguir
                  </span>
                </TrackLink>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 text-center text-xs text-dim">© 2026 ARK305</footer>
      </div>
    </main>
  );
}
