import { expect, it } from "vitest";
import { chromium, firefox, webkit } from "playwright";
import { writeFile } from "node:fs/promises";
import { performanceFixtures } from "../tooling/performanceFixtures";
import { startTestServer, type ServedRequest } from "../tooling/testServer";
import { documentJourney } from "../tooling/performanceJourney";
import { performanceExports } from "../tooling/performanceExports";

it("measures real and mixed 2000-page documents and checks saved output", async () => {
  const name = process.env.PDFREE_BROWSER ?? "chromium";
  if (!(name in { chromium, firefox, webkit })) throw new Error("Unknown browser engine.");
  const fixtures = await performanceFixtures();
  const root = process.env.PDFREE_PERF_BUILD ?? "dist";
  const records = [];
  for (const fixture of fixtures.filter((file) => file.pages === 2000)) {
    const requests: ServedRequest[] = [];
    const server = await startTestServer({
      root,
      production: true,
      observe: (request) => requests.push(request),
    });
    const browser = await { chromium, firefox, webkit }[
      name as "chromium" | "firefox" | "webkit"
    ].launch({ headless: true });
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(120_000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(server.url);
      await page.locator(".drop-card").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");
      const welcomeBytes = requests.reduce((sum, request) => sum + request.encodedBytes, 0);
      const metrics = await documentJourney(page, fixture.path, fixture.pages);
      Object.assign(metrics, await performanceExports(page, fixture.pages));
      expect(errors).toEqual([]);
      records.push({
        build: root,
        browser: name,
        version: browser.version(),
        fixture,
        welcomeBytes,
        metrics,
      });
      console.log("Document measurements", JSON.stringify(records.at(-1)));
    } finally {
      await browser.close();
      await server.close();
    }
  }
  await writeFile(
    `test-results/performance/measurements-${name}.json`,
    JSON.stringify(records, null, 2)
  );
});
