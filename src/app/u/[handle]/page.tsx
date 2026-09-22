import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { getDictionary } from "@/lib/i18n";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";

// Perfil público: ark305.com/@usuario (proxy.ts lo trae hasta aquí).
export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const { locale } = await getDictionary();
  const profile = getProfile(handle);
  if (!profile) return {};
  return { title: `${profile.name} (@${profile.handle})`, description: `${profile.role[locale]} · ${profile.area}` };
}

export default async function PublicProfilePage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const profile = getProfile(handle);
  if (!profile) notFound();
  const { locale, t } = await getDictionary();
  return <ProfileView profile={profile} isOwner={profile.handle === CURRENT_HANDLE} locale={locale} t={t} />;
}
