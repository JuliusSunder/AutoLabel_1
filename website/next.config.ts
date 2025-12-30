import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp'],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize middleware bundle size
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
