import type { NextConfig } from "next";

// The browser talks to the API through the site's own origin, and Vercel
// proxies these paths to the host server-side. Same-origin means no CORS at
// all — which matters because the API's hosting proxy interferes with the
// Origin header, so browser CORS against it directly is unreliable.
const API_ORIGIN =
  process.env.API_PROXY_ORIGIN ?? "https://p5vdvh8b2y.c35.airoapp.ai";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` },
      { source: "/socket.io/:path*", destination: `${API_ORIGIN}/socket.io/:path*` },
      { source: "/uploads/:path*", destination: `${API_ORIGIN}/uploads/:path*` },
    ];
  },
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
