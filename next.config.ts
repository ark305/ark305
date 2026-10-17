import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pitch deck: ark305.com/pitch sirve la página estática de public/pitch.
  async rewrites() {
    return [
      { source: "/pitch", destination: "/pitch/index.html" },
      { source: "/pitch/", destination: "/pitch/index.html" },
      { source: "/pitch/es", destination: "/pitch/es/index.html" },
    ];
  },
  images: {
    remotePatterns: [
      // Fotos de ejemplo (Unsplash, licencia libre).
      new URL("https://images.unsplash.com/**"),
      // Fotos que sube cada persona a Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
