"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LMap, LayerGroup, Marker, Polyline } from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import { DEMO_TRIP_MIN, MIAMI_CENTER, demoRoute, mapNodes, type MapKind } from "@/lib/map";

const COLORS: Record<MapKind, string> = { residence: "#D8B170", provider: "#5EEAD4", demand: "#F472B6" };
const KINDS: MapKind[] = ["residence", "provider", "demand"];
const TRIP_SECONDS = 45;

export type MapLabels = {
  filters: Record<MapKind, string>;
  track: {
    title: string;
    who: string;
    to: string;
    eta: string;
    status: { onWay: string; near: string; arrived: string };
    restart: string;
    demo: string;
  };
};

// Distancia acumulada del recorrido para interpolar la posición del proveedor.
function pointAt(t: number): [number, number] {
  const seg = demoRoute.slice(1).map((p, i) => Math.hypot(p[0] - demoRoute[i][0], p[1] - demoRoute[i][1]));
  let d = t * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = seg[i] ? d / seg[i] : 0;
      const [a, b] = [demoRoute[i], demoRoute[i + 1]];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    d -= seg[i];
  }
  return demoRoute[demoRoute.length - 1];
}

export function ArkMap({ labels, locale }: { labels: MapLabels; locale: Locale }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const groups = useRef<Partial<Record<MapKind, LayerGroup>>>({});
  const car = useRef<Marker | null>(null);
  const trail = useRef<Polyline | null>(null);
  const [on, setOn] = useState<Record<MapKind, boolean>>({ residence: true, provider: true, demand: true });
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { center: MIAMI_CENTER, zoom: 12, zoomControl: false, attributionControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        className: "ark-dark-tiles",
      }).addTo(m);
      L.control.zoom({ position: "bottomright" }).addTo(m);

      for (const kind of KINDS) groups.current[kind] = L.layerGroup().addTo(m);
      for (const n of mapNodes) {
        const popup = `<strong>${n.name}</strong><br/>${n.sub[locale]}`;
        if (n.kind === "demand") {
          L.circle([n.lat, n.lng], { radius: 250 + (n.size ?? 10) * 28, color: COLORS.demand, weight: 1, fillOpacity: 0.18 }).bindPopup(popup).addTo(groups.current.demand!);
        } else {
          const icon = L.divIcon({
            className: "",
            html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${COLORS[n.kind]};border:2px solid #0b0b0b;box-shadow:0 0 0 3px ${COLORS[n.kind]}55"></span>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([n.lat, n.lng], { icon, title: n.name }).bindPopup(popup).addTo(groups.current[n.kind]!);
        }
      }

      L.polyline(demoRoute, { color: "#ffffff", weight: 3, opacity: 0.25, dashArray: "6 6" }).addTo(m);
      trail.current = L.polyline([demoRoute[0]], { color: "#5EEAD4", weight: 4 }).addTo(m);
      const dest = demoRoute[demoRoute.length - 1];
      L.marker(dest, { icon: L.divIcon({ className: "", html: '<svg width="26" height="34" viewBox="0 0 26 34"><path d="M13 1C6.4 1 1 6.3 1 12.9 1 22 13 33 13 33s12-11 12-20.1C25 6.3 19.6 1 13 1z" fill="#D8B170" stroke="#0b0b0b" stroke-width="2"/><circle cx="13" cy="13" r="4.5" fill="#0b0b0b"/></svg>', iconSize: [26, 34], iconAnchor: [13, 33] }) }).addTo(m);
      car.current = L.marker(demoRoute[0], {
        icon: L.divIcon({ className: "", html: '<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#5EEAD4;border:3px solid #0b0b0b;color:#0b0b0b"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zm2.2 0h9.6l-1-3H8.2zM7.5 14.5a1.5 1.5 0 1 0 0-.01zm9 0a1.5 1.5 0 1 0 0-.01z"/></svg></span>', iconSize: [30, 30], iconAnchor: [15, 15] }),
        zIndexOffset: 1000,
      }).addTo(m);
      m.fitBounds(L.latLngBounds(mapNodes.map((n) => [n.lat, n.lng] as [number, number])), { padding: [24, 24] });
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [locale]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    for (const kind of KINDS) {
      const g = groups.current[kind];
      if (!g) continue;
      if (on[kind]) g.addTo(m);
      else g.remove();
    }
  }, [on, ready]);

  useEffect(() => {
    if (!ready || progress >= 1) return;
    const id = setTimeout(() => setProgress((p) => Math.min(1, p + 1 / (TRIP_SECONDS * 2))), 500);
    return () => clearTimeout(id);
  }, [progress, ready]);

  useEffect(() => {
    const pos = pointAt(progress);
    car.current?.setLatLng(pos);
    const done = demoRoute.filter((_, i) => i / (demoRoute.length - 1) <= progress);
    trail.current?.setLatLngs([...done, pos]);
  }, [progress]);

  const mins = Math.ceil((1 - progress) * DEMO_TRIP_MIN);
  const t = labels.track;
  const status = progress >= 1 ? t.status.arrived : progress > 0.8 ? t.status.near : t.status.onWay;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="group">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={on[k]}
            onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold ${on[k] ? "border-white/20 bg-white/[0.08] text-white" : "border-white/10 text-mute"}`}
          >
            <span className="size-2.5 rounded-full" style={{ background: COLORS[k], opacity: on[k] ? 1 : 0.35 }} />
            {labels.filters[k]}
          </button>
        ))}
      </div>

      <div ref={el} className="h-[440px] w-full overflow-hidden rounded-[22px] border border-white/[0.08] bg-raised" />

      <div className="flex flex-col gap-3 rounded-[22px] border border-gold/25 bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">{t.title}</p>
            <p className="mt-1 text-[15px] font-bold text-white">{t.who}</p>
            <p className="text-[12px] text-mute">{t.to}</p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/40 bg-gold/[0.08] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">{t.demo}</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-white" aria-live="polite">{progress >= 1 ? status : t.eta.replace("{m}", String(mins))}</p>
            <p className="text-[12px] text-cream/70">{status}</p>
          </div>
          <button type="button" onClick={() => setProgress(0)} className="h-9 rounded-full border border-gold/40 px-4 text-[12px] font-bold text-gold-soft">
            {t.restart}
          </button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="gold-grad h-full rounded-full transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
