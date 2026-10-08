import { beforeAll, afterAll, afterEach, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page, type Download } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import AxeBuilder from "@axe-core/playwright";
import { unzipSync } from "fflate";
import { startTestServer } from "../tooling/testServer";
import { formFixture } from "./core/fixtures";
import { readProject } from "./core/projects";
import { scanFixture } from "../tooling/scanFixture";
import { installSplitProbe, readSplitProbe, restoreSplitProbe } from "../tooling/splitProbe";
import { savedPdfText } from "../tooling/pdfText";
let server: Awaited<ReturnType<typeof startTestServer>>, browser: Browser;
const engineName = process.env.PDFREE_BROWSER ?? "chromium";
beforeAll(async () => {
  server = await startTestServer();
  const engines = { chromium, firefox, webkit };
  if (!(engineName in engines)) throw new Error("Choose chromium, firefox or webkit.");
  browser = await engines[engineName as keyof typeof engines].launch({ headless: true });
  await mkdir("test-results", { recursive: true });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});
afterEach(() => server?.reconnect());
async function downloadBytes(download: Download) {
  const path = await download.path();
  if (!path) throw new Error("The browser did not create a download.");
  return new Uint8Array(await readFile(path));
}
async function openFixture(page: Page) {
  await page.goto(server.url);
  await page.locator(".drop-card input").setInputFiles({
    name: "local.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await formFixture()),
  });
  await page.getByText("PAGE 1 OF 3", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Ready to work offline", exact: true }).waitFor();
}
async function downloadPdf(page: Page) {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const ready = page.waitForEvent("download", { timeout: 8000 });
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  try {
    return downloadBytes(await ready);
  } catch (error) {
    const alerts = await page.getByRole("alert").allTextContents();
    const controller = await page.evaluate(
      () => navigator.serviceWorker.controller?.scriptURL ?? "uncontrolled"
    );
    throw new Error(`${String(error)}; alerts: ${alerts.join("; ")}; worker: ${controller}`);
  }
}
it("uses the production CSP, remains offline, downloads editable projects and filled PDFs without data requests", async () => {
  const context = await browser.newContext(),
    page = await context.newPage(),
    requests: { url: string; method: string }[] = [],
    errors: string[] = [];
  page.on("request", (request) => requests.push({ url: request.url(), method: request.method() }));
  page.on("pageerror", (error) => errors.push(error.message));
  await openFixture(page);
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Offline Ada");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  await writeFile(
    `test-results/${engineName}-accessibility.json`,
    JSON.stringify(accessibility.violations, null, 2)
  );
  expect(
    accessibility.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    }))
  ).toEqual([]);
  await page.screenshot({ path: `test-results/${engineName}-editor.png` });
  // Playwright 1.63 WebKit kills service-worker responses in setOffline (issue 42775).
  if (engineName === "webkit") server.disconnect();
  else await context.setOffline(true);
  expect(
    await page.evaluate(() =>
      fetch("/offline-negative-control").then(
        () => false,
        () => true
      )
    )
  ).toBe(true);
  const pdf = await PDFDocument.load(await downloadPdf(page));
  expect(pdf.getForm().getTextField("name").getText()).toBe("Offline Ada");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const projectDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download editing project" }).click();
  const archive = await downloadBytes(await projectDownload);
  expect((await readProject(archive)).pages).toHaveLength(3);
  await page.reload();
  await page.getByRole("button", { name: "Recover draft" }).click();
  expect(await page.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
    "Offline Ada"
  );
  expect((await PDFDocument.load(await downloadPdf(page))).getPageCount()).toBe(3);
  expect(errors).toEqual([]);
  expect(
    requests.filter(
      (request) =>
        request.method !== "GET" ||
        (!request.url.startsWith(server.url) && !request.url.startsWith("blob:"))
    )
  ).toEqual([]);
  await context.close();
  server.reconnect();
});
it("supports a touch-sized workspace, drawn signatures, splitting and project downloads", async () => {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    }),
    page = await context.newPage();
  await openFixture(page);
  await page.getByRole("button", { name: "Pages", exact: true }).tap();
  await page.getByRole("button", { name: "Move page later", exact: true }).first().tap();
  await page.getByText("PAGE 2 OF 3", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Hide pages", exact: true }).tap();
  await page.getByRole("button", { name: "Sign", exact: true }).click();
  const pad = await page.getByLabel("Draw your signature", { exact: true }).boundingBox();
  if (!pad) throw new Error("The signature pad is missing.");
  await page.mouse.move(pad.x + 40, pad.y + 60);
  await page.mouse.down();
  await page.mouse.move(pad.x + 100, pad.y + 95, { steps: 5 });
  await page.mouse.move(pad.x + 180, pad.y + 50, { steps: 5 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Use signature" }).click();
  await page.locator(".page-surface").tap({ position: { x: 70, y: 100 } });
  expect(await page.locator(".placed-object img").count()).toBe(1);
  await page.getByRole("button", { name: "Pages", exact: true }).tap();
  await page.getByRole("button", { name: "More", exact: true }).tap();
  await page.getByRole("button", { name: "Split", exact: true }).click();
  expect(await page.locator(".split-preview li").count()).toBe(2);
  const single = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download local-01.pdf", exact: true }).click();
  expect((await PDFDocument.load(await downloadBytes(await single))).getPageCount()).toBe(1);
  const ready = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download 2 PDFs as ZIP" }).click();
  const outputs = unzipSync(await downloadBytes(await ready));
  expect(Object.keys(outputs)).toHaveLength(2);
  expect((await PDFDocument.load(Object.values(outputs)[0])).getPageCount()).toBe(1);
  await page.screenshot({ path: `test-results/${engineName}-touch.png` });
  await context.close();
});
it("reports exhausted draft storage and still downloads the filled PDF", async () => {
  const context = await browser.newContext(),
    page = await context.newPage();
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException("Synthetic storage quota", "QuotaExceededError");
    };
  });
  await openFixture(page);
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Quota Ada");
  await page.getByText("Draft could not be saved.", { exact: false }).waitFor();
  const pdf = await PDFDocument.load(await downloadPdf(page));
  expect(pdf.getForm().getTextField("name").getText()).toBe("Quota Ada");
  await context.close();
});
it.skipIf(engineName !== "chromium")(
  "bounds rendering for a large scanned document and extracts an edited page",
  async () => {
    const bytes = await scanFixture(64),
      context = await browser.newContext(),
      page = await context.newPage();
    await page.goto(server.url);
    const started = performance.now();
    await writeFile("test-results/large-scans.pdf", bytes);
    await page.locator(".drop-card input").setInputFiles("test-results/large-scans.pdf");
    await page.getByText("PAGE 1 OF 64", { exact: true }).waitFor();
    const importMs = performance.now() - started;
    expect(await page.locator("canvas").count()).toBeLessThanOrEqual(12);
    await page.getByRole("button", { name: "Text", exact: true }).click();
    await page.locator(".page-surface").click({ position: { x: 80, y: 100 } });
    await page.getByRole("textbox", { name: "Object text" }).fill("Large scan edit");
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("button", { name: "Extract", exact: true }).click();
    const ready = page.waitForEvent("download"),
      exported = performance.now();
    await page.getByRole("button", { name: "Download PDF", exact: true }).click();
    const output = await downloadBytes(await ready),
      exportMs = performance.now() - exported;
    expect((await PDFDocument.load(output)).getPageCount()).toBe(1);
    expect(await savedPdfText(output)).toContain("Large scan edit");
    const split = await splitLargeScan(page);
    const measurements = {
      pages: 64,
      inputBytes: bytes.length,
      outputBytes: output.length,
      importMs: Math.round(importMs),
      extractMs: Math.round(exportMs),
      mountedCanvases: await page.locator("canvas").count(),
      ...split,
    };
    await writeFile("test-results/large-scan.json", JSON.stringify(measurements, null, 2));
    console.log("Large scan measurement", measurements);
    await context.close();
  }
);

async function splitLargeScan(page: Page) {
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await page.getByRole("combobox", { name: /^Split method/ }).selectOption("individual");
  const started = performance.now();
  await installSplitProbe(page);
  try {
    const downloaded = page.waitForEvent("download", { timeout: 45_000 });
    await page.getByRole("button", { name: "Download 64 PDFs as ZIP", exact: true }).click();
    const bytes = await downloadBytes(await downloaded),
      names: string[] = [];
    const edges = unzipSync(bytes, {
      filter: (entry) => {
        names.push(entry.name);
        return /-(01|64)\.pdf$/.test(entry.name);
      },
    });
    expect(names).toHaveLength(64);
    for (const output of Object.values(edges))
      expect((await PDFDocument.load(output)).getPageCount()).toBe(1);
    const edgeNames = Object.keys(edges).sort();
    expect(await savedPdfText(edges[edgeNames[0]])).toContain("Large scan edit");
    expect(await savedPdfText(edges[edgeNames[1]])).not.toContain("Large scan edit");
    const probe = await readSplitProbe(page);
    expect(probe.browserTicks).toBeGreaterThanOrEqual(2);
    expect(probe.maxGapMs).toBeLessThan(500);
    return {
      splitMs: Math.round(performance.now() - started),
      splitZipBytes: bytes.length,
      splitOutputs: names.length,
      ...probe,
    };
  } finally {
    await restoreSplitProbe(page);
  }
}

it("detects a blocked main thread during the actual split worker interval", async () => {
  const context = await browser.newContext(),
    page = await context.newPage();
  try {
    await openFixture(page);
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("button", { name: "Split", exact: true }).click();
    await installSplitProbe(page, 700);
    try {
      const ready = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download 2 PDFs as ZIP", exact: true }).click();
      expect(Object.keys(unzipSync(await downloadBytes(await ready)))).toHaveLength(2);
      const probe = await readSplitProbe(page);
      expect(probe.maxGapMs).toBeGreaterThanOrEqual(650);
      expect(probe.workerSplitMs).toBeGreaterThanOrEqual(700);
    } finally {
      await restoreSplitProbe(page);
    }
  } finally {
    await context.close();
  }
});
