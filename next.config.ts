import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false, // disable Next.js strict typed routes check
  },
  typescript: {
    ignoreBuildErrors: true, // skip TypeScript errors at build time
  },
  eslint: {
    ignoreDuringBuilds: true, // skip ESLint errors at build time
  },
};

export default nextConfig;
