import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate unique build IDs to force cache invalidation
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Ensure static optimization
  reactStrictMode: true,

  // Force fresh builds
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
