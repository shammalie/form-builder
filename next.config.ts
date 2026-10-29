import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone reach `next dev` through a Cloudflare quick tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // The floating dev badge covers the sticky Save bar on phones.
  devIndicators: false,
  cacheComponents: true,
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
