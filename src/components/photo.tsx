import Image from "next/image";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

// Foto que llena su contenedor. Si la persona aún no subió una, muestra sus iniciales.
export function Photo({ src, name, sizes, priority, className = "object-cover" }: { src: string | null | undefined; name: string; sizes: string; priority?: boolean; className?: string }) {
  if (src) return <Image src={src} alt="" fill sizes={sizes} priority={priority} className={className} />;
  const letters = initials(name);
  return (
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(120%_120%_at_30%_20%,#3a3226_0%,#1b1d22_55%,#08090b_100%)] font-display font-semibold text-gold-soft"
      style={{ fontSize: "clamp(12px, 38cqw, 140px)", containerType: "size" }}
    >
      {letters || (
        <svg viewBox="0 0 24 24" width="45%" height="45%" fill="none" stroke="#EBD3A0" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )}
    </span>
  );
}
