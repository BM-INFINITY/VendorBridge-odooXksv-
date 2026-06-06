import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable Server Actions (stable in Next.js 15, but kept for clarity)
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
