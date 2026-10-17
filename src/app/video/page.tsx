import type { Metadata } from "next";
import Image from "next/image";
import { IconCamera } from "@/components/icons";
import { VideoApp } from "@/components/video-app";
import { getContext, getDictionary } from "@/lib/i18n";
import { photo } from "@/lib/mock-data";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.video.title, description: t.video.intro };
}

// ARK Video: versión solo de videógrafos para el evento. Se llega por QR (/video/qr).
export default async function VideoPage() {
  const { locale, t } = await getContext();
  const v = t.video;
  return (
    <div data-exp="business" className="flex flex-col gap-7">
      <section className="relative flex h-[380px] flex-col justify-end gap-2 overflow-hidden px-5 pb-6">
        <Image src={photo("photo-1579109652910-99b9be06aaec")} alt="" fill priority sizes="430px" className="object-cover" />
        <div className="fade-bottom absolute inset-0" />
        <div className="relative flex items-center gap-2">
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-gold/50 bg-black/40 px-3 py-1 text-[12px] font-bold text-gold-soft backdrop-blur">
            <IconCamera size={13} stroke="#EBD3A0" weight={2} /> {v.badge}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[12px] font-semibold text-cream backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-[#ff5a5a]" /> {v.live}
          </span>
        </div>
        <h1 className="relative font-display text-[36px] leading-[1.05] font-semibold text-white">{v.title}</h1>
        <p className="relative text-[15px] leading-normal text-cream/80">{v.intro}</p>
      </section>
      <VideoApp locale={locale} />
    </div>
  );
}
