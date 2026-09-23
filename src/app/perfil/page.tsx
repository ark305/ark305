import type { Metadata } from "next";
import { ProfileView } from "@/components/profile-view";
import { getContext, getDictionary } from "@/lib/i18n";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.profile };
}

export default async function MyProfilePage() {
  const { locale, t, mode, level } = await getContext();
  const me = getProfile(CURRENT_HANDLE)!;
  return <ProfileView profile={me} isOwner locale={locale} t={t} mode={mode} level={level} />;
}
