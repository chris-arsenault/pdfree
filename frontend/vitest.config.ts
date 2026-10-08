import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { copyPdfAssets } from "./tooling/pdfAssets";
import { VitePWA } from "vite-plugin-pwa";
copyPdfAssets();
function browserName(): "chromium" | "firefox" | "webkit" {
  const name = process.env.PDFREE_BROWSER;
  if (name === "firefox" || name === "webkit") return name;
  return "chromium";
}

export default defineConfig({
  plugins: [VitePWA({ injectRegister: null })],
  optimizeDeps: {
    include: [
      "pdf-lib",
      "pdfjs-dist",
      "@pdf-lib/fontkit",
      "react",
      "react-dom/client",
      "lucide-react",
      "idb-keyval",
      "fflate",
      "zod",
      "@libpdf/core",
      "pkijs",
      "asn1js",
      "node-forge",
      "tesseract.js",
    ],
  },
  test: {
    coverage: { provider: "v8", reporter: ["text", "lcov"], include: ["src/core/**/*.ts"] },
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: [
            "src/**/*.browser.test.ts",
            "src/**/*.release.test.ts",
            "src/**/*.security.test.ts",
          ],
        },
      },
      ...(!process.env.CI || process.env.PDFREE_BROWSER
        ? [
            {
              extends: true as const,
              test: {
                name: "browser",
                include: ["src/**/*.browser.test.ts"],
                browser: {
                  enabled: true,
                  headless: true,
                  viewport: { width: 1280, height: 720 },
                  provider: playwright(),
                  instances: [{ browser: browserName() }],
                },
              },
            },
          ]
        : []),
      ...(process.env.PDFREE_RELEASE_TESTS
        ? [
            {
              test: {
                name: "release",
                include: ["src/**/*.release.test.ts"],
                testTimeout: 60_000,
                hookTimeout: 30_000,
              },
            },
          ]
        : []),
      ...(process.env.PDFREE_SECURITY_TESTS
        ? [
            {
              test: {
                name: "security",
                include: ["src/**/*.security.test.ts"],
                testTimeout: 30_000,
              },
            },
          ]
        : []),
    ],
  },
});
