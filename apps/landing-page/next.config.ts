import type { NextConfig } from "next";
import path from "node:path";
// Validates .env before dev, build and start run; a missing or invalid
// variable stops the app (type-envgen lists the bad keys, never values).
import "./src/shared/env/env";

const nextConfig: NextConfig = {
  // Hide the Next.js dev-mode badge in the corner of the page.
  devIndicators: false,
  // Component / function caching with "use cache"; every page prerenders as a static shell.
  cacheComponents: true,
  partialPrefetching: true,
  // Auto-memoises every client component, so props that didn't change never re-render.
  reactCompiler: true,
  // Self-hosted Node server: `.next/standalone` is what CI ships (see docs/landing-deploy.md).
  output: "standalone",
  // Monorepo root, so standalone tracing picks up packages/* and the hoisted node_modules.
  outputFileTracingRoot: path.join(
    import.meta.dirname,
    "../..",
  ),
  // sharp (image optimisation) loads native libvips libraries that file tracing misses under
  // pnpm, so ship every @img/sharp-* package (platform binaries + libvips) with the server.
  outputFileTracingIncludes: { "/**": ["../../node_modules/.pnpm/@img+sharp-*/**/*"] },
  // @truckmoov/api ships TypeScript source.
  transpilePackages: ["@truckmoov/api"],
  poweredByHeader: false,
  images: {
    formats: [
      "image/avif",
      "image/webp",
    ],
  },
};

export default nextConfig;
