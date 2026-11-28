import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@/components/shadcn": path.resolve(
        __dirname,
        "../../packages/reusables/src/components/shadcn",
      ),
      "@/lib/utils": path.resolve(
        __dirname,
        "../../packages/reusables/src/lib/utils.ts",
      ),
      "@": path.resolve(
        __dirname,
        "./src",
      ),
    },
  },
});
