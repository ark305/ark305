import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
