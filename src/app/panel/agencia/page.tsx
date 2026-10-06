import type { Metadata } from "next";
import Link from "next/link";
import { AgenciaDashboard } from "./dashboard";
import { getAgencyProfileLinks, getAgencyProfiles } from "@/lib/agency";
import { supabaseReady } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Agencia · ARK305" };

// Panel privado del roster: perfiles, links y clics.
export default async function AgenciaPage() {
  if (!supabaseReady) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16">
        <h1 className="font-display text-3xl font-bold">Agencia</h1>
        <p className="mt-4 rounded-2xl border border-line bg-card p-5 text-sm text-mute">
          El panel necesita Supabase configurado. Copia <code>.env.example</code> a{" "}
          <code>.env.local</code>, pon tus valores y aplica{" "}
          <code>supabase/003_agency.sql</code> en el SQL Editor.
        </p>
        <Link href="/panel" className="mt-4 inline-block text-sm text-gold">← Volver al panel</Link>
      </main>
    );
  }
  const profiles = await getAgencyProfiles();
  const initialLinks = profiles[0] ? await getAgencyProfileLinks(profiles[0].id) : [];
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16">
      <header className="mb-6">
        <p className="text-xs font-bold tracking-[0.2em] text-dim">ARK305 AGENCY</p>
        <h1 className="font-display text-3xl font-bold">Roster</h1>
        <p className="mt-1 text-sm text-mute">
          Perfiles, links y clics de tu roster. Los cambios se publican al instante en{" "}
          <code className="text-cream">/p/handle</code>.
        </p>
      </header>
      <AgenciaDashboard profiles={profiles} initialLinks={initialLinks} />
      <Link href="/panel" className="mt-8 inline-block text-sm text-gold">← Volver al panel</Link>
    </main>
  );
}
