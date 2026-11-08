import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.GITHUB_ACTIONS ? "/mirofish-mvp" : "",
  cacheComponents: !process.env.GITHUB_ACTIONS,
  partialPrefetching: !process.env.GITHUB_ACTIONS,
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
