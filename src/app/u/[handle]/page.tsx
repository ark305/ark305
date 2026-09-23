import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { getContext } from "@/lib/i18n";
import { CURRENT_HANDLE } from "@/lib/mock-data";
import { findProfile, getViewer } from "@/lib/profiles-db";
import { supabaseReady } from "@/lib/supabase/config";

// Perfil público: ark305.com/@usuario (proxy.ts lo trae hasta aquí).
export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const { locale, level } = await getContext();
  const profile = await findProfile(handle);
  if (!profile || (profile.private && level !== "vip")) return {};
  return {
    title: `${profile.name} (@${profile.handle})`,
    description: [profile.role[locale], profile.area].filter(Boolean).join(" · "),
    openGraph: profile.photo ? { images: [profile.photo] } : undefined,
  };
}

export default async function PublicProfilePage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const profile = await findProfile(handle);
  const { locale, t, level, mode, exp } = await getContext();
  // Perfil oculto: los proveedores de ARK Private solo los ve el nivel VIP.
  if (!profile || (profile.private && level !== "vip")) notFound();

  const viewer = await getViewer();
  const mine = viewer.row ? viewer.row.handle === profile.handle : !supabaseReady && profile.handle === CURRENT_HANDLE;
  const r = mine ? viewer.row : null;
  return (
    <ProfileView
      profile={profile}
      isOwner={mine}
      real={!!r}
      signedIn={!!viewer.userId}
      locale={locale}
      t={t}
      mode={mode}
      level={level}
      exp={exp}
      steps={r ? { photo: !!r.photo_url, service: viewer.services.length > 0, bio: r.bio_link, shared: r.shared } : undefined}
    />
  );
}
