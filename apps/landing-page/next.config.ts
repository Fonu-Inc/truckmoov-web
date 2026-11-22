import type { NextConfig } from "next";
// Validates .env before dev, build and start run; a missing or invalid
// variable stops the app (type-envgen lists the bad keys, never values).
import "./src/shared/env/env";

const nextConfig: NextConfig = {
  // Hide the Next.js dev-mode badge in the corner of the page.
  devIndicators: false,
  // Auto-memoises every client component, so props that didn't change never re-render.
  reactCompiler: true,
  // Static HTML export: CI ships `out/`, nginx serves it directly, no Node process.
  // Cache Components and Partial Prefetching are disabled because they enable PPR,
  // which Next refuses to combine with export mode.
  output: "export",
  // Emit `/about/index.html` rather than `/about.html`, so nginx's `$uri/` lookup
  // resolves every route without a rewrite rule.
  trailingSlash: true,
  // @truckmoov/api and @truckmoov/app-core ship TypeScript source.
  transpilePackages: [
    "@truckmoov/api",
    "@truckmoov/app-core",
  ],
  poweredByHeader: false,
  images: {
    // A static export has no image optimisation endpoint. Keep next/image's
    // layout and lazy-loading behaviour, but serve the original files.
    unoptimized: true,
  },
};

export default nextConfig;
