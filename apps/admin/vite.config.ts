import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3002,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@/components/shadcn": path.resolve(__dirname, "../../packages/reusables/src/components/shadcn"),
      "@/lib/utils": path.resolve(__dirname, "../../packages/reusables/src/lib/utils.ts"),
      "@": path.resolve(__dirname, "./src"),
      // Workaround: the published fonu-sdk package points module to a missing ESM bundle.
      // Force Vite to use the published CJS build instead.
      "fonu-sdk": "fonu-sdk/dist/fonu-sdk.js",
    },
    // Prevent duplicate React/react-query instances causing hooks/QueryClient errors
    dedupe: ["react", "react-dom", "react/jsx-runtime", "zustand", "@tanstack/react-query"],
  },
  preview: {
    host: true,                 // allow binding on 0.0.0.0
    port: 6173,
    allowedHosts: [
      'appdemo.truckmoov.com',
      '.truckmoov.com'          // allows any subdomain under truckmoov.com
    ],
  },
}));
