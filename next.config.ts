import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Fotos de perfil do Google
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Fotos do Supabase Storage (futuro)
      {
        protocol: "https",
        hostname: "afulbdsxidsapefdgnry.supabase.co",
      },
    ],
  },
};

export default nextConfig;
