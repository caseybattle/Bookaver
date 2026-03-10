import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    unstable_allowDynamic: [
      "/node_modules/@clerk/**",
      "/node_modules/@radix-ui/**",
    ],
  },
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
    ],
  },
};

export default nextConfig;
