import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles a server to run anywhere, which is what a
  // self-hosted deployment needs. Vercel builds its own output and does not
  // want it, so it is only set when building somewhere else.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
