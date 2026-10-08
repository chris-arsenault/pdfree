import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { copyPdfAssets } from "./tooling/pdfAssets";
copyPdfAssets();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      manifest: {
        name: "PDFree · Ahara",
        short_name: "PDFree",
        description: "Fill, sign, and organize PDFs locally.",
        theme_color: "#112c32",
        background_color: "#f4f3ed",
        display: "standalone",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ["**/*.{js,mjs,css,html,svg,woff,woff2,ttf,pfb,bcmap,icc,wasm,txt}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  worker: { format: "es" },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        // The website module discovers the entry through assets/index-*.js.
        chunkFileNames: "assets/chunk-[name]-[hash].js",
      },
    },
  },
});
