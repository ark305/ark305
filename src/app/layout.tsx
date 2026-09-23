import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { ToastProvider } from "@/components/toast";
import { getContext, getDictionary } from "@/lib/i18n";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";
import { getViewer } from "@/lib/profiles-db";
import { supabaseReady } from "@/lib/supabase/config";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: { default: "ARK305", template: "%s · ARK305" }, description: t.meta.description };
}

export const viewport: Viewport = {
  themeColor: "#08090B",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t, mode, level } = await getContext();
  // Con base de datos: tu perfil real (o invitado). Sin base de datos: el perfil de ejemplo.
  const me = supabaseReady ? (await getViewer()).profile : getProfile(CURRENT_HANDLE)!;

  return (
    <html lang={locale} className={`${fraunces.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <ToastProvider soonMessage={t.common.soon}>
          <main className="relative mx-auto min-h-dvh w-full max-w-[430px] pb-[120px]">{children}</main>
          <BottomNav labels={t.nav} avatar={me?.photo ?? null} name={me?.name ?? ""} handle={me?.handle ?? null} mode={mode} level={level} />
        </ToastProvider>
      </body>
    </html>
  );
}
