import type { Metadata } from "next";
import Link from "next/link";
import { AuthEmailRequest } from "@/components/auth-email-request";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.auth.registerTitle };
}

export default async function CreateAccountPage() {
  const { locale, t } = await getContext();
  return (
    <div className="flex flex-col gap-4 px-4 pt-10">
      <AuthEmailRequest locale={locale} mode="register" />
      <p className="text-center text-sm text-mute">{t.auth.alreadyHaveAccount} <Link href="/entrar" className="font-semibold text-cream underline">{t.auth.signIn}</Link></p>
    </div>
  );
}
