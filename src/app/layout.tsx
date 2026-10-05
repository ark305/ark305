import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { ToastProvider } from "@/components/toast";
import { DiagnosisGate } from "@/components/diagnosis-chat";
import { DiagnosisSync } from "@/components/diagnosis-sync";
import { SideFade } from "@/components/side-switch";
import { sanitize } from "@/lib/diagnosis";
import { getContext, getDictionary } from "@/lib/i18n";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";
import { getViewer } from "@/lib/profiles-db";
import { supabaseReady } from "@/lib/supabase/config";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  const title = "ARK305";
  const description = t.meta.description;
  return {
    metadataBase: new URL("https://ark305.com"),
    title: { default: title, template: "%s · ARK305" },
    description,
    openGraph: {
      type: "website",
      siteName: "ARK305",
      title,
      description,
      url: "/",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "ARK305" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#08090B",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t, level, side, view, diagnosis } = await getContext();
  // Con base de datos: tu perfil real (o invitado). Sin base de datos: el perfil de ejemplo.
  const viewer = await getViewer();
  const me = supabaseReady ? viewer.profile : getProfile(CURRENT_HANDLE)!;

  return (
    <html lang={locale} data-exp={view} className={`${fraunces.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <ToastProvider soonMessage={t.common.soon}>
          <main className="relative mx-auto min-h-dvh w-full max-w-[430px] pb-[calc(124px+env(safe-area-inset-bottom))]">{children}</main>
          {!side && <DiagnosisGate locale={locale} />}
          {viewer.userId && <DiagnosisSync fromAccount={diagnosis && "answers" in diagnosis ? sanitize(diagnosis.answers) : null} />}
          <SideFade side={side ?? "personal"} />
          <BottomNav labels={t.nav} avatar={me?.photo ?? null} name={me?.name ?? ""} handle={me?.handle ?? null} side={side ?? "personal"} level={level} />
        </ToastProvider>
      </body>
    </html>
  );
}
