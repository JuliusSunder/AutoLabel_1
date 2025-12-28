import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp'],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
