import { beforeAll, afterAll, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser } from "playwright";
import { startTestServer, type ServedRequest } from "../tooling/testServer";
import { formFixture } from "./core/fixtures";
import { readFile, readdir } from "node:fs/promises";

let server: Awaited<ReturnType<typeof startTestServer>>, browser: Browser;
const requests: ServedRequest[] = [];
beforeAll(async () => {
  server = await startTestServer({
    production: true,
    observe: (request) => requests.push(request),
  });
  const name = process.env.PDFREE_BROWSER ?? "chromium";
  if (!(name in { chromium, firefox, webkit })) throw new Error("Unknown browser engine.");
  browser = await { chromium, firefox, webkit }[name as "chromium" | "firefox" | "webkit"].launch({
    headless: true,
  });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});

it("defers document resources and reuses immutable welcome assets", async () => {
  const context = await browser.newContext(),
    page = await context.newPage();
  try {
    const start = requests.length;
    await page.goto(server.url);
    await page.locator(".drop-card").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    const cold = requests.slice(start);
    expect(cold.filter((request) => /Worker|\.mjs$|\/ocr\/|\/pdfjs\//.test(request.path))).toEqual(
      []
    );
    expect(cold.filter((request) => /\.woff2$/.test(request.path))).toHaveLength(1);
    expect(cold.filter((request) => /\.ttf$|caveat/.test(request.path))).toEqual([]);
    const warmStart = requests.length;
    await page.reload();
    await page.locator(".drop-card").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(
      requests.slice(warmStart).filter((request) => request.path.startsWith("/assets/"))
    ).toEqual([]);
  } finally {
    await context.close();
  }
});

it("retains UI font metrics and precaches UI and PDF fonts", async () => {
  const assets = await readdir("dist/assets");
  const original = assets.find((name) => /^NotoSans-Regular-.*\.ttf$/.test(name));
  expect(original).toBeTruthy();
  const worker = await readFile("dist/sw.js", "utf8");
  for (const pattern of [
    /^NotoSans-Regular-.*\.ttf$/,
    /^NotoSans-Regular-.*\.woff2$/,
    /^caveat-.*\.woff$/,
  ]) {
    const name = assets.find((asset) => pattern.test(asset));
    expect(name).toBeTruthy();
    expect(worker).toContain(name);
  }
  const context = await browser.newContext(),
    page = await context.newPage();
  try {
    await page.goto(server.url);
    const widths = await page.evaluate(async (name) => {
      await document.fonts.ready;
      const reference = await new FontFace("Original PDFree", `url(/assets/${name})`, {
        weight: "100 900",
      }).load();
      document.fonts.add(reference);
      const ctx = document.createElement("canvas").getContext("2d")!;
      return [400, 700].flatMap((weight) =>
        ["PDFree Résumé 0123", "Ελληνικά Русский", "Tiếng Việt Türkçe"].map((text) => {
          ctx.font = `${weight} 16px "Noto Sans"`;
          const width = ctx.measureText(text).width;
          ctx.font = `${weight} 16px "Original PDFree"`;
          return Math.abs(width - ctx.measureText(text).width);
        })
      );
    }, original!);
    expect(widths.every((difference) => difference < 0.01)).toBe(true);
  } finally {
    await context.close();
  }
});

it("downloads document fonts on export and keeps the shared PDF worker", async () => {
  const context = await browser.newContext(),
    page = await context.newPage();
  try {
    const start = requests.length;
    await page.goto(server.url);
    await page.locator(".drop-card input").setInputFiles({
      name: "ordinary.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await formFixture()),
    });
    await page.getByRole("textbox", { name: "name", exact: true }).waitFor();
    await page.waitForLoadState("networkidle");
    const first = requests.slice(start);
    expect(
      first.filter((request) => /(?:securityWorker|caveat|NotoSans.*\.ttf$)/.test(request.path))
    ).toEqual([]);
    expect(first.filter((request) => /\/pdfWorker-[^/]+\.js$/.test(request.path))).toHaveLength(1);
    const ready = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    await page.getByRole("button", { name: "Download PDF", exact: true }).click();
    await ready;
    expect(requests.slice(start).some((request) => /NotoSans.*\.ttf$/.test(request.path))).toBe(
      true
    );
    expect(requests.slice(start).some((request) => /caveat/.test(request.path))).toBe(false);
  } finally {
    await context.close();
  }
});

it("keeps edits and normal browser reload protection after a dialog fails to load", async () => {
  const context = await browser.newContext(),
    page = await context.newPage();
  try {
    await page.goto(server.url);
    await page.locator(".drop-card input").setInputFiles({
      name: "edited.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await formFixture()),
    });
    await page.getByRole("textbox", { name: "name", exact: true }).fill("Retained edit");
    await page.route(/\/assets\/ExportDialog-[^/]+\.js$/, (route) => route.abort());
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const reload = page.getByRole("button", { name: "Update and reload", exact: true });
    await reload.waitFor();
    expect(await reload.isEnabled()).toBe(true);
    const warning = page.waitForEvent("dialog").then(async (dialog) => {
      expect(dialog.type()).toBe("beforeunload");
      await dialog.dismiss();
    });
    await reload.click();
    await warning;
    await page.getByRole("button", { name: "Close dialog", exact: true }).click();
    expect(await page.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      "Retained edit"
    );
    expect(await page.locator(".document-tab").count()).toBe(1);
  } finally {
    await context.close();
  }
});
