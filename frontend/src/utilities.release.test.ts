import { beforeAll, afterAll, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { startTestServer } from "../tooling/testServer";
import { enableOfflineCopy } from "../tooling/offlineCopy";
import { formFixture } from "./core/fixtures";
let browser: Browser, server: Awaited<ReturnType<typeof startTestServer>>;
const engine = process.env.PDFREE_BROWSER ?? "chromium";
beforeAll(async () => {
  server = await startTestServer();
  browser = await { chromium, firefox, webkit }[engine as "chromium" | "firefox" | "webkit"].launch(
    { headless: true }
  );
  await mkdir("test-results", { recursive: true });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    }))
  ).toEqual([]);
}
async function tool(page: Page, name: string) {
  const more = page.getByRole("button", { name: "More", exact: true });
  if (!(await more.isVisible()))
    await page.getByRole("button", { name: "Pages", exact: true }).click();
  await more.click();
  await page.getByRole("button", { name, exact: true }).click();
}
async function downloadPdf(page: Page, button = "Download PDF") {
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: button, exact: true }).click();
  const path = await (await downloading).path();
  return new Uint8Array(await readFile(path!));
}
function readPdf(data: Uint8Array) {
  return getDocument({ data, standardFontDataUrl: `${resolve("public/pdfjs/standard_fonts")}/` })
    .promise;
}
async function restoredSession(page: Page, value: string) {
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByText("Saved", { exact: true }).waitFor({ state: "attached" });
  await page.reload();
  await page.getByRole("textbox", { name: "name", exact: true }).waitFor();
  expect(await page.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(value);
}
it.each([1280, 320])(
  "keeps utilities usable and document state isolated at %ipx",
  async (width) => {
    const context = await browser.newContext({ viewport: { width, height: 844 } }),
      page = await context.newPage();
    try {
      await page.goto(server.url);
      const file = {
        name: "First.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(await formFixture()),
      };
      await page.locator(".drop-card input").setInputFiles(file);
      await page.getByRole("textbox", { name: "name", exact: true }).fill("First document value");
      await tool(page, "Repeat across pages");
      await page.getByLabel("Number prefix", { exact: true }).fill("BATES-");
      await page.getByLabel("Minimum digits", { exact: true }).fill("4");
      await accessible(page);
      await page.getByRole("button", { name: "Apply rule", exact: true }).click();
      await page
        .locator(".document-tabs input[type=file]")
        .setInputFiles({ ...file, name: "Second.pdf" });
      await page.getByRole("textbox", { name: "name", exact: true }).fill("Second document value");
      await page
        .locator(".document-tab")
        .getByRole("button", { name: /First.pdf/, exact: false })
        .first()
        .click();
      expect(await page.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
        "First document value"
      );
      await page.getByRole("button", { name: "Export", exact: true }).click();
      const bytes = await downloadPdf(page),
        pdf = await readPdf(bytes);
      try {
        expect(
          (await (await pdf.getPage(1)).getAnnotations()).find((item) => item.fieldName === "name")
            ?.fieldValue
        ).toBe("First document value");
        expect(
          (await (await pdf.getPage(3)).getTextContent()).items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
        ).toContain("BATES-0003");
      } finally {
        await pdf.destroy();
      }
      await page.getByRole("button", { name: "Export", exact: true }).click();
      await page.getByRole("radio", { name: "Printable sheets", exact: true }).click();
      await page.getByRole("combobox", { name: "Pages per sheet", exact: true }).selectOption("2");
      await page.getByRole("button", { name: "Preview first sheet", exact: true }).click();
      await expect
        .poll(() =>
          page
            .locator(".utility-preview canvas")
            .evaluate((canvas: HTMLCanvasElement) => canvas.width > 0)
        )
        .toBe(true);
      await accessible(page);
      await page.screenshot({ path: `test-results/${engine}-utilities-${width}.png` });
      const print = await PDFDocument.load(await downloadPdf(page, "Download 2-up PDF"));
      expect(print.getPageCount()).toBe(2);
      expect(print.getForm().getFields()).toHaveLength(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width
      );
      await restoredSession(page, "First document value");
    } finally {
      await context.close();
    }
  }
);
async function scan(page: Page) {
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 2000;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.font = "60px Arial";
    context.fillText("OFFLINE SEARCHABLE SCAN 12345", 100, 260);
    return canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
  });
  const pdf = await PDFDocument.create(),
    embedded = await pdf.embedJpg(Buffer.from(image, "base64"));
  pdf.addPage([600, 750]).drawImage(embedded, { x: 0, y: 0, width: 600, height: 750 });
  return Buffer.from(await pdf.save());
}
it("runs English OCR from the production offline cache with no external requests", async () => {
  const context = await browser.newContext(),
    page = await context.newPage(),
    errors: string[] = [],
    external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  context.on("request", (request) => {
    if (
      !request.url().startsWith(server.url) &&
      !request.url().startsWith("blob:") &&
      !request.url().startsWith("data:")
    )
      external.push(request.url());
  });
  try {
    await page.goto(server.url);
    await enableOfflineCopy(page);
    await page
      .locator(".drop-card input")
      .setInputFiles({ name: "Scan.pdf", mimeType: "application/pdf", buffer: await scan(page) });
    await page.getByRole("region", { name: "PDF page", exact: true }).waitFor();
    if (engine === "webkit") server.disconnect();
    else await context.setOffline(true);
    await page
      .getByRole("group", { name: "Scan tools", exact: true })
      .getByRole("button", { name: "Recognize text", exact: true })
      .click();
    await page.getByRole("button", { name: "Recognize 1 page(s)", exact: true }).click();
    await page.getByText(/word\(s\) found on 1 page\(s\)/).waitFor();
    expect(await page.locator(".ocr-text").textContent()).toContain("SEARCHABLE");
    await page.getByRole("button", { name: "Show on page", exact: true }).click();
    await page.locator(".recognized-layer.revealed").waitFor();
    expect(await page.locator(".recognized-layer").textContent()).toContain("SEARCHABLE");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const pdf = await readPdf(await downloadPdf(page));
    try {
      expect(
        (await (await pdf.getPage(1)).getTextContent()).items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
      ).toContain("SEARCHABLE");
    } finally {
      await pdf.destroy();
    }
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    server.reconnect();
  }
}, 120_000);
