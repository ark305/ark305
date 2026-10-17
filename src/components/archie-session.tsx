"use client";

import { ArchieProvider } from "@archie/react-sdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { archie, writeTokenCookie } from "@/lib/archie/browser";
import { archieReady } from "@/lib/archie/config";

// Mantiene la sesión de Archie y la cookie del servidor sincronizadas:
// al entrar, salir o renovar el token, vuelve a pintar la página con tus datos.
function SessionSync() {
  const router = useRouter();
  useEffect(() => {
    const client = archie();
    let alive = true;
    client.auth.waitForInit().then(() => {
      if (alive && writeTokenCookie(client.auth.getSession())) router.refresh();
    });
    const off = client.auth.onAuthStateChange((event, session) => {
      if (event === "SESSION_EXPIRING") return;
      if (writeTokenCookie(session)) router.refresh();
    });
    return () => {
      alive = false;
      off();
    };
  }, [router]);
  return null;
}

export function ArchieSession({ children }: { children: React.ReactNode }) {
  if (!archieReady) return <>{children}</>;
  return (
    <ArchieProvider client={archie()}>
      <SessionSync />
      {children}
    </ArchieProvider>
  );
}
