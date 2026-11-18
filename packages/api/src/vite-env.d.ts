// Types for the env value @truckmoov/api reads (see lib/env.ts). Kept minimal so it merges
// cleanly with Vite's own client types in the Vite apps, and still type-checks under Next.js.
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
