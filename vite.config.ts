import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "causing-dandruff-kitten.ngrok-free.dev",
    ],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Workaround: npm fonu-sdk package points module to a missing ESM bundle.
      // Force Vite to use the published CJS build instead.
      "fonu-sdk": "fonu-sdk/dist/fonu-sdk.js",
    },
    // Prevent duplicate React instances causing hooks errors
    dedupe: ["react", "react-dom", "react/jsx-runtime", "zustand"],
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
