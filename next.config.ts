import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.4.3"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.mlstatic.com" },
      { protocol: "http", hostname: "**.mlstatic.com" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
    ],
  },
  partialPrefetching: true,
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
