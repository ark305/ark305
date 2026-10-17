"use client";

import dynamic from "next/dynamic";

// Leaflet necesita `window`: el mapa solo se carga en el navegador.
export const ArkMapLazy = dynamic(() => import("./ark-map").then((m) => m.ArkMap), {
  ssr: false,
  loading: () => <div className="h-[440px] w-full animate-pulse rounded-[22px] border border-white/[0.08] bg-raised" />,
});
