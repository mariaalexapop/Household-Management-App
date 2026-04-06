import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  turbopack: {
    // Explicitly set the workspace root to the project directory
    // to avoid Next.js confusing this with the parent Warp_project workspace
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
