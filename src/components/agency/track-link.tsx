"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

// Link que registra el clic en /api/agency/click (fire-and-forget, sin PII)
// y deja que el navegador abra el destino con normalidad.
export function TrackLink({
  profileId,
  linkId,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { profileId: string; linkId: string }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    rest.onClick?.(e);
    try {
      const body = JSON.stringify({ profile_id: profileId, link_id: linkId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/agency/click", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/agency/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      // El tracking nunca debe romper la navegación.
    }
  };
  return (
    <a {...rest} onClick={onClick}>
      {children}
    </a>
  );
}
