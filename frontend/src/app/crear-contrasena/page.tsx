import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetPassword } from "@/components/set-password";
import { getContext, getDictionary } from "@/lib/i18n";
import { supabaseReady } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function endSessionForUser(expectedUserId: string): Promise<boolean> {
  "use server";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(expectedUserId)) return false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || data.user?.id !== expectedUserId) return false;
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    return !signOutError;
  } catch {
    return false;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.auth.setupPasswordTitle };
}

export default async function CreatePasswordPage({ searchParams }: PageProps<"/crear-contrasena">) {
  const { locale } = await getContext();
  const { purpose } = await searchParams;
  if (supabaseReady) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) redirect("/entrar?error=link");
    return (
      <div className="px-4 pt-10">
        <SetPassword locale={locale} purpose={purpose === "recovery" ? "recovery" : "setup"} expectedUserId={data.user.id} endSession={endSessionForUser} />
      </div>
    );
  }
  return <div className="px-4 pt-10"><SetPassword locale={locale} purpose={purpose === "recovery" ? "recovery" : "setup"} expectedUserId="" /></div>;
}
