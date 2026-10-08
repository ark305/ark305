import type { Car, CarCat } from "@/lib/cars";

// Dibujo del auto (sin fotos ni marcas): silueta según categoría, pintada del color del auto.
const BODY: Record<CarCat, string> = {
  super: "M10 44 L14 38 C24 34 36 30 48 25 C58 21 72 21 82 26 L102 33 C108 35 111 38 111 44 Z",
  sport: "M10 44 L13 37 C22 34 32 31 42 24 C52 18 68 18 78 24 L100 32 C107 34 110 38 110 44 Z",
  gt: "M9 44 L12 37 C22 33 32 31 40 25 C50 19 70 19 80 25 L101 32 C108 34 111 38 111 44 Z",
  conv: "M10 44 L13 36 C24 33 36 32 46 31 L58 27 L64 31 L100 32 C107 33 110 38 110 44 Z",
  suv: "M9 44 L10 33 C12 29 18 27 24 27 L34 18 C38 15 42 14 48 14 L86 14 C92 14 95 17 97 22 L106 28 C110 30 111 36 111 44 Z",
  ev: "M10 44 L12 36 C20 33 30 30 40 23 C50 17 72 17 82 23 L102 31 C108 33 110 38 110 44 Z",
};

const GLASS: Record<CarCat, string> = {
  super: "M46 27 C54 23 68 22 78 26 L84 29 L50 29 Z",
  sport: "M42 26 C50 20 66 20 76 25 L82 28 L44 28 Z",
  gt: "M40 27 C48 21 68 21 78 26 L84 29 L42 29 Z",
  conv: "",
  suv: "M36 26 L44 18 C46 17 48 16 52 16 L84 16 C88 16 90 18 92 21 L96 26 Z",
  ev: "M40 25 C48 19 70 19 80 24 L86 28 L42 28 Z",
};

// Distingue los colores muy claros para que el dibujo no se pierda en el fondo oscuro.
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum > 140 ? "#00000066" : "#ffffff59";
}

export function CarArt({ car, className = "" }: { car: Car; className?: string }) {
  const cat = car.cat;
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`g-${car.id}`} cx="50%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#2a2c33" />
          <stop offset="100%" stopColor="#0e0f12" />
        </radialGradient>
      </defs>
      <rect width="120" height="60" fill={`url(#g-${car.id})`} />
      <ellipse cx="60" cy="50" rx="50" ry="3.5" fill="#000" opacity=".55" />
      <path d={BODY[cat]} fill={car.hex} stroke={shade(car.hex)} strokeWidth="1" />
      {GLASS[cat] && <path d={GLASS[cat]} fill="#0b1118" opacity=".85" />}
      {cat === "conv" && <path d="M58 27 L64 31" stroke="#0b1118" strokeWidth="1.5" />}
      <rect x="104" y="36" width="5" height="2.2" rx="1" fill="#FFE9B0" />
      <rect x="10.5" y="38" width="4" height="2" rx="1" fill="#FF6A48" />
      {[30, 90].map((x) => (
        <g key={x}>
          <circle cx={x} cy="44" r="8" fill="#0b0c0f" />
          <circle cx={x} cy="44" r="4.4" fill="#3a3d44" />
          <circle cx={x} cy="44" r="1.6" fill="#9a9ea6" />
        </g>
      ))}
    </svg>
  );
}
