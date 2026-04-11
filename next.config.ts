import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pitfall 1 (Phase 5 research): Next.js bundling breaks pdf-parse's worker +
  // canvas resolution in serverless. These packages must remain external so
  // their node-only dependencies are resolved at runtime rather than bundled.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
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
