import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    const sequenceCacheHeaders = [
      { key: "Cache-Control", value: "public, max-age=60" },
    ];

    return ["frame1", "sec2", "newsec"].map((sequence) => ({
      source: `/${sequence}/:path*`,
      headers: sequenceCacheHeaders,
    }));
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
