import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.video.qrTitle };
}

// Pantalla para proyectar en el evento: QR que abre /video en el teléfono.
export default async function VideoQrPage() {
  const { t } = await getDictionary();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "ark305.com";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/video?src=qr`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#08090B", light: "#EFE6D8" } });

  return (
    <div data-exp="business" className="flex min-h-[80dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-gold/50 px-3 py-1 text-[12px] font-bold tracking-[0.12em] text-gold-soft uppercase">ARK Video</span>
      <h1 className="font-display text-[34px] leading-tight font-semibold text-white">{t.video.qrTitle}</h1>
      <div className="w-full max-w-[320px] overflow-hidden rounded-[28px] border border-gold/40 bg-cream p-4" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-[15px] text-cream/80">{t.video.qrSub}</p>
      <p className="text-[13px] font-semibold break-all text-gold-soft">{url.replace(/^https?:\/\//, "").replace("?src=qr", "")}</p>
    </div>
  );
}
