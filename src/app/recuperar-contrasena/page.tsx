import type { Metadata } from "next";
import { AuthEmailRequest } from "@/components/auth-email-request";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.auth.recoveryTitle };
}

export default async function RecoverPasswordPage() {
  const { locale } = await getContext();
  return <div className="px-4 pt-10"><AuthEmailRequest locale={locale} mode="recovery" /></div>;
}
