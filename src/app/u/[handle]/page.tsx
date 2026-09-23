import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { getContext } from "@/lib/i18n";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";

// Perfil público: ark305.com/@usuario (proxy.ts lo trae hasta aquí).
export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const { locale, level } = await getContext();
  const profile = getProfile(handle);
  if (!profile || (profile.private && level !== "vip")) return {};
  return { title: `${profile.name} (@${profile.handle})`, description: `${profile.role[locale]} · ${profile.area}` };
}

export default async function PublicProfilePage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const profile = getProfile(handle);
  const { locale, t, level, mode } = await getContext();
  // Perfil oculto: los proveedores de ARK Private solo los ve el nivel VIP.
  if (!profile || (profile.private && level !== "vip")) notFound();
  return <ProfileView profile={profile} isOwner={profile.handle === CURRENT_HANDLE} locale={locale} t={t} mode={mode} level={level} />;
}
