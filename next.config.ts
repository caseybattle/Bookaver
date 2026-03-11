import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  // Explicitly opt in to Turbopack (default in Next 16) alongside
  // the webpack config below (used for production/Edge runtime only).
  turbopack: {},
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.resolve.conditionNames = [
        "edge-light",
        "worker",
        "browser",
        "require",
        "default",
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.vercel-storage.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
};

export default nextConfig;
