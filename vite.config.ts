import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import devServer from "@hono/vite-dev-server";
import build from "@hono/vite-build/cloudflare-pages";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      plugins: [tailwindcss()],
      build: {
        outDir: "dist/static",
        rollupOptions: {
          input: "src/client.ts",
          output: {
            entryFileNames: "style.js",
            assetFileNames: "[name][extname]",
          },
        },
      },
    };
  }
  return {
    plugins: [
      tailwindcss(),
      devServer({ entry: "src/index.tsx" }),
      build({ entry: "src/index.tsx" }),
    ],
  };
});
