import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true" || process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? (isGitHubPages ? "/longform-rasterizer" : ""),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

