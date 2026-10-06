// Glyphs reales de Instagram, TikTok y YouTube (SVG inline, sin dependencias).
export function InstagramGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TiktokGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 3c.4 2.3 1.9 3.8 4.4 4v3.1c-1.7 0-3.2-.5-4.4-1.4v6.6c0 3.9-2.7 6.7-6.5 6.7-3.6 0-6.4-2.7-6.4-6.3 0-3.7 3-6.5 6.8-6.3v3.3c-1.9-.4-3.6.9-3.6 3 0 1.8 1.4 3.1 3.2 3.1 1.9 0 3.3-1.4 3.3-3.5V3h3.2z" />
    </svg>
  );
}

export function YoutubeGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23 7.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.6 3.6 12 3.6 12 3.6s-4.6 0-7.7.3c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.1.8 11v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.6 1 1.9.2 7.5.3 7.5.3s4.6 0 7.7-.4c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V11c0-1.9-.2-3.8-.2-3.8zM9.8 15V8.4l6.2 3.3-6.2 3.3z" />
    </svg>
  );
}

export type Platform = "instagram" | "tiktok" | "youtube" | "other";

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  return "other";
}

export function PlatformGlyph({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === "instagram") return <InstagramGlyph className={className} />;
  if (platform === "tiktok") return <TiktokGlyph className={className} />;
  if (platform === "youtube") return <YoutubeGlyph className={className} />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}
