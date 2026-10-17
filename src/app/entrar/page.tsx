import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/sign-in";
import { getDictionary } from "@/lib/i18n";
import { getViewer } from "@/lib/profiles-db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.auth.title };
}

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const { locale } = await getDictionary();
  const viewer = await getViewer();
  if (viewer.userId) redirect(viewer.row ? "/perfil" : "/bienvenida");
  const { next } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/perfil";
  return (
    <div className="px-4 pt-10">
      <p className="mb-6 font-display text-[34px] leading-none font-semibold text-white">
        ARK<span className="text-gold">305</span>
      </p>
      <SignIn locale={locale} next={safeNext} />
    </div>
  );
}
