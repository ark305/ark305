"use client";

import { AccountLoadError } from "@/components/account-load-error";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100dvh", background: "#08090b" }}>
        <AccountLoadError retry={retry} />
      </body>
    </html>
  );
}
