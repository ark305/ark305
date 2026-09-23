import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de ejemplo (Unsplash, licencia libre) mientras no hay fotos reales en Supabase.
    remotePatterns: [new URL("https://images.unsplash.com/**")],
  },
};

export default nextConfig;
