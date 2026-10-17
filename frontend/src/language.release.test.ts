import { beforeAll, afterAll, afterEach, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page, type Download } from "playwright";
import { readFile } from "node:fs/promises";
import { PDFDict, PDFDocument, PDFName, PDFString } from "pdf-lib";
import AxeBuilder from "@axe-core/playwright";
import { locales, type Locale } from "./i18n/locales";
import { loadCatalog } from "./i18n/catalogs";
import { formFixture } from "./core/fixtures";
import { readProject } from "./core/projects";
import { startTestServer } from "../tooling/testServer";
import { enableOfflineCopy, workerState } from "../tooling/offlineCopy";
import { savedPdfText } from "../tooling/pdfText";
import { scanFixture } from "../tooling/scanFixture";

let browser: Browser, server: Awaited<ReturnType<typeof startTestServer>>;
const engineName = process.env.PDFREE_BROWSER ?? "chromium";
beforeAll(async () => {
  server = await startTestServer();
  const engines = { chromium, firefox, webkit };
  browser = await engines[engineName as keyof typeof engines].launch({ headless: true });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});
afterEach(() => server.reconnect());
async function choose(page: Page, code: Locale) {
  await page.locator(".language-trigger").click();
  await page
    .getByRole("radio", { name: locales.find((locale) => locale.code === code)!.name, exact: true })
    .click();
  await expect.poll(() => page.locator("html").getAttribute("lang")).toBe(code);
  await page.locator(".language-panel").waitFor({ state: "hidden" });
  await expect
    .poll(() =>
      page
        .locator(".language-trigger img")
        .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)
    )
    .toBe(true);
}
async function bytes(download: Download) {
  const path = await download.path();
  if (!path) throw new Error("No downloaded file");
  return new Uint8Array(await readFile(path));
}

async function checkScriptGlyph(page: Page, locale: Locale) {
  const samples: Partial<Record<Locale, string>> = {
    "zh-Hans": "中",
    "zh-Hant": "體",
    ja: "語",
    ko: "한",
    hi: "ह",
    ar: "ع",
    bn: "ব",
  };
  const sample = samples[locale];
  if (!sample) return;
  expect(
    await page.evaluate(async (character) => {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d")!;
      context.font = '32px "Noto Sans", sans-serif';
      const pixels = (value: string) => {
        context.clearRect(0, 0, 64, 64);
        context.fillText(value, 4, 40);
        return canvas.toDataURL();
      };
      return pixels(character) !== pixels(String.fromCodePoint(0x10ffff));
    }, sample),
    `Distinct fallback glyph for ${locale}`
  ).toBe(true);
}

it("loads catalogs on demand, persists selection and switches all languages offline without changing saved content", async () => {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  const requests: { url: string; method: string }[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push({ url: request.url(), method: request.method() }));
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(server.url);
    await page.locator(".language-trigger").waitFor();
    expect(await workerState(page)).toEqual({ registrations: 0, caches: 0 });
    expect(
      requests.some((request) => /\/assets\/(ja|ar|bn|ko|zh-Hans|zh-Hant)-/.test(request.url))
    ).toBe(false);
    await choose(page, "fr");
    await page.reload();
    await expect.poll(() => page.locator("html").getAttribute("lang")).toBe("fr");
    await page.getByText("Ouvrir un PDF", { exact: true }).waitFor();
    const unsupported = await PDFDocument.load(await formFixture());
    unsupported.catalog
      .lookup(PDFName.of("AcroForm"), PDFDict)
      .set(PDFName.of("XFA"), PDFString.of("Unsupported form fixture"));
    await page.locator(".drop-card input").setInputFiles({
      name: "unsupported.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await unsupported.save()),
    });
    const french = await loadCatalog("fr");
    await expect.poll(() => page.getByRole("alert").textContent()).toContain(french["errors.xfa"]);
    await choose(page, "es");
    const spanish = await loadCatalog("es");
    await expect.poll(() => page.getByRole("alert").textContent()).toContain(spanish["errors.xfa"]);
    await page
      .getByRole("button", { name: spanish["notifications.dismissError"], exact: true })
      .click();
    await choose(page, "en");
    const source = await formFixture();
    await page.locator(".drop-card input").setInputFiles({
      name: "Keep filename.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(source),
    });
    await page.getByRole("textbox", { name: "name", exact: true }).fill("Keep field value 42");
    await page.getByRole("button", { name: "Text", exact: true }).click();
    await page.locator(".page-surface").click({ position: { x: 260, y: 300 } });
    await page.getByRole("textbox", { name: "Object text", exact: true }).fill("Keep added text");
    const surface = await page.locator(".page-surface").elementHandle();
    await enableOfflineCopy(page);
    if (engineName === "webkit") server.disconnect();
    else await context.setOffline(true);
    expect(
      await page.evaluate(() =>
        fetch("/uncached-language-negative-control").then(
          () => false,
          () => true
        )
      )
    ).toBe(true);
    for (const locale of locales) {
      await choose(page, locale.code);
      const catalog = await loadCatalog(locale.code);
      await checkScriptGlyph(page, locale.code);
      await page.getByRole("button", { name: catalog["common.export"], exact: true }).waitFor();
      expect(await page.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
        "Keep field value 42"
      );
      expect(
        await page.locator(".page-surface").evaluate((node, before) => node === before, surface)
      ).toBe(true);
      expect(await page.locator("html").getAttribute("dir")).toBeNull();
      expect(await page.locator(".document-tab").textContent()).toContain("Keep filename.pdf");
      if (["ar", "ja", "en"].includes(locale.code)) {
        await page.locator(".language-trigger").click();
        const accessibility = await new AxeBuilder({ page })
          .include(".language-panel")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(accessibility.violations.map((violation) => violation.id)).toEqual([]);
        await page.keyboard.press("Escape");
      }
    }
    const catalog = await loadCatalog("vi");
    await page.getByRole("button", { name: catalog["common.export"], exact: true }).click();
    const pdfReady = page.waitForEvent("download");
    await page.getByRole("button", { name: catalog["export.downloadPdf"], exact: true }).click();
    const pdfBytes = await bytes(await pdfReady);
    const pdf = await PDFDocument.load(pdfBytes);
    expect(pdf.getForm().getTextField("name").getText()).toBe("Keep field value 42");
    expect(await savedPdfText(pdfBytes)).toContain("Keep added text");
    await page.getByRole("button", { name: catalog["common.export"], exact: true }).click();
    await page.getByRole("radio", { name: catalog["export.project"], exact: true }).check();
    const projectReady = page.waitForEvent("download");
    await page
      .getByRole("button", { name: catalog["export.downloadProject"], exact: true })
      .click();
    const project = await readProject(await bytes(await projectReady));
    expect(project.name).toBe("Keep filename.pdf");
    expect(project.sources[0].bytes).toEqual(source);
    expect(Object.values(project.values)).toContain("Keep field value 42");
    expect(project.pages[0].objects.some((object) => object.text === "Keep added text")).toBe(true);
    expect(project).not.toHaveProperty("locale");
    expect(project).not.toHaveProperty("language");
    expect(errors).toEqual([]);
    expect(
      requests.every((request) => request.method === "GET" && request.url.startsWith(server.url))
    ).toBe(true);
  } finally {
    server.reconnect();
    await context.close();
  }
});

it("updates another tab's open recognition progress without canceling its worker", async () => {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage(),
    picker = await context.newPage();
  let release = () => {};
  let entered = () => {};
  const loading = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const resume = new Promise<void>((resolve) => {
    release = resolve;
  });
  await context.route("**/ocr/lang/eng.traineddata.gz", async (route) => {
    entered();
    await resume;
    await route.continue();
  });
  try {
    await page.goto(server.url);
    await page.locator(".drop-card input").setInputFiles({
      name: "scan.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await scanFixture(1)),
    });
    await page
      .locator(".toolbar")
      .getByRole("button", { name: "Recognize text", exact: true })
      .click();
    await page.getByRole("button", { name: "Recognize 1 page", exact: true }).click();
    await loading;
    await picker.goto(server.url);
    await choose(picker, "es");
    await expect.poll(() => page.locator("html").getAttribute("lang")).toBe("es");
    await page.getByRole("dialog", { name: "Reconocer texto escaneado", exact: true }).waitFor();
    expect(await page.locator(".processing-status").textContent()).toContain("Cargando");
    expect(await page.locator(".processing-status").isVisible()).toBe(true);
    release();
    await page.locator(".processing-status").waitFor({ state: "hidden", timeout: 45_000 });
    expect(await page.getByRole("alert").count()).toBe(0);
    await page.getByRole("button", { name: "Cerrar diálogo", exact: true }).click();
    expect(await page.locator(".document-tab").textContent()).toContain("scan.pdf");
    await page.reload();
    await expect.poll(() => page.locator("html").getAttribute("lang")).toBe("es");
  } finally {
    release();
    await context.close();
  }
});
