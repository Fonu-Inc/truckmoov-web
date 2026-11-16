import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(
        __dirname,
        "./src",
      ),

    },
    // Prevent duplicate React/react-query instances causing hooks/QueryClient errors
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "zustand",
      "@tanstack/react-query",
    ],
  },
  server: {
    host: "::",
    port: 3000,
    strictPort: true,
  },
});
