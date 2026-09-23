import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getDictionary } from "@/lib/i18n";
import { getViewer } from "@/lib/profiles-db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.onboarding.title };
}

// Primera vez que alguien entra: crea su perfil.
export default async function WelcomePage() {
  const { locale, t } = await getDictionary();
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/entrar");
  if (viewer.row) redirect("/perfil");
  return (
    <div className="flex flex-col gap-6 px-4 pt-10">
      <header>
        <h1 className="font-display text-[40px] leading-[1.05] font-semibold text-white">{t.onboarding.title}</h1>
        <p className="mt-2 text-[15px] leading-normal text-mute">{t.onboarding.sub}</p>
      </header>
      <OnboardingForm locale={locale} uid={viewer.userId} email={viewer.email} />
    </div>
  );
}
