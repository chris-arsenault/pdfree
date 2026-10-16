import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import AxeBuilder from "@axe-core/playwright";
import { startTestServer } from "../tooling/testServer";
import { formFixture } from "./core/fixtures";

let server: Awaited<ReturnType<typeof startTestServer>>, browser: Browser;
const engine = process.env.PDFREE_BROWSER ?? "chromium";
const instructions = "Instructions: enter the applicant name on page 1.";
const applicant = "Pinned reference Ada";
beforeAll(async () => {
  server = await startTestServer();
  const engines = { chromium, firefox, webkit };
  if (!(engine in engines)) throw new Error("Choose chromium, firefox or webkit.");
  browser = await engines[engine as keyof typeof engines].launch({ headless: true });
  await mkdir("test-results", { recursive: true });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function applicationFixture() {
  const pdf = await PDFDocument.load(await formFixture("Application"));
  const page = pdf.getPage(2);
  page.setRotation(degrees(0));
  page.drawText(instructions, {
    x: 48,
    y: 500,
    size: 18,
    font: await pdf.embedFont(StandardFonts.Helvetica),
  });
  return pdf.save();
}
async function chrome(page: Page) {
  return page.evaluate(() =>
    [".app-header", ".document-tabs", ".toolbar", ".navigator", ".app-footer", ".page-sidebar"].map(
      (selector) => {
        const { x, y, width, height } = document.querySelector(selector)!.getBoundingClientRect();
        return { x, y, width, height };
      }
    )
  );
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))
  ).toEqual([]);
}
async function downloadedPdf(page: Page) {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const path = await (await downloading).path();
  if (!path) throw new Error("The completed application did not download.");
  return new Uint8Array(await readFile(path));
}
async function verifySavedPdf(bytes: Uint8Array) {
  const warnings = vi.spyOn(console, "warn"),
    errors = vi.spyOn(console, "error"),
    log = vi.spyOn(console, "log");
  try {
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(3);
    expect(pdf.getForm().getTextField("name").getText()).toBe(applicant);
    expect(pdf.getForm().getTextField("name").acroField.getWidgets()).toHaveLength(2);
    const reader = await getDocument({
      data: bytes.slice(),
      standardFontDataUrl: `${resolve("public/pdfjs/standard_fonts")}/`,
    }).promise;
    try {
      expect(reader.numPages).toBe(3);
      for (const number of [1, 2]) {
        const annotations = await (await reader.getPage(number)).getAnnotations();
        expect(annotations.find((item) => item.fieldName === "name")?.fieldValue).toBe(applicant);
      }
      const text = await (await reader.getPage(3)).getTextContent();
      expect(text.items.map((item) => ("str" in item ? item.str : "")).join(" ")).toContain(
        instructions
      );
    } finally {
      await reader.destroy();
    }
    expect(warnings).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(log.mock.calls.filter((args) => /Warning:|Error:/i.test(args.join(" ")))).toEqual([]);
  } finally {
    warnings.mockRestore();
    errors.mockRestore();
    log.mockRestore();
  }
}

it("pins instructions while completing a form, floats and docks the reference, then exports and reopens the completed PDF", async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors: string[] = [],
    requests: { url: string; method: string }[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push({ url: request.url(), method: request.method() }));
  try {
    await page.goto(server.url);
    await page.locator(".drop-card input").setInputFiles({
      name: "Application.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await applicationFixture()),
    });
    await page.getByRole("region", { name: "PDF page", exact: true }).waitFor();
    const initialChrome = await chrome(page);
    await page.getByRole("button", { name: "Pin page 3", exact: true }).click();
    await page.getByText("Pinned page 3", { exact: true }).waitFor();
    await page.getByText("PAGE 1 OF 3", { exact: true }).waitFor();
    const reference = page.getByRole("region", { name: "Pinned PDF page", exact: true });
    await expect.poll(() => reference.locator(".textLayer").textContent()).toContain(instructions);
    const field = page
      .getByRole("region", { name: "PDF page", exact: true })
      .getByRole("textbox", { name: "name", exact: true });
    await field.fill(applicant);
    await page
      .getByRole("separator", { name: "Pinned page width", exact: true })
      .press("ArrowLeft");
    await accessible(page);
    await exerciseFloatingReference(page);
    await expect.poll(() => reference.locator(".textLayer").textContent()).toContain(instructions);
    await page.getByText("PAGE 1 OF 3", { exact: true }).waitFor();
    expect(await chrome(page)).toEqual(initialChrome);
    await page.screenshot({ path: `test-results/${engine}-pinned-page-journey.png` });
    const bytes = await downloadedPdf(page);
    await verifySavedPdf(bytes);
    await page.locator(".header-actions input[type=file]").setInputFiles({
      name: "Completed application.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(bytes),
    });
    await page
      .getByRole("button", { name: "Close Completed application.pdf", exact: true })
      .waitFor();
    expect(await page.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      applicant
    );
    expect(await page.locator(".pinned-page").count()).toBe(0);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect
      .poll(() => page.getByRole("textbox", { name: "name", exact: true }).inputValue())
      .toBe(applicant);
    await page
      .locator(".document-tab > button:first-child")
      .filter({ hasText: /^(?:•\s*)?Application\.pdf$/ })
      .click();
    await page.getByText("Pinned page 3", { exact: true }).waitFor();
    expect(
      await page.getByRole("combobox", { name: "Pinned page zoom", exact: true }).inputValue()
    ).toBe("200");
    expect(errors).toEqual([]);
    expect(
      requests.filter(
        (request) =>
          request.method !== "GET" ||
          (!request.url.startsWith(server.url) &&
            !request.url.startsWith("blob:") &&
            !request.url.startsWith("data:"))
      )
    ).toEqual([]);
  } finally {
    await context.close();
  }
});

async function exerciseFloatingReference(page: Page) {
  const zoom = page.getByRole("combobox", { name: "Pinned page zoom", exact: true });
  const mainZoom = await page.getByRole("combobox", { name: "Zoom", exact: true }).inputValue();
  await zoom.selectOption("200");
  const mainTop = await page.locator(".page-scroll").evaluate((element) => element.scrollTop);
  const viewport = page.getByRole("region", { name: "Pinned page viewport", exact: true });
  const before = await viewport.evaluate((element) => element.scrollTop);
  await viewport.hover();
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(before + 60);
  expect(await page.locator(".page-scroll").evaluate((element) => element.scrollTop)).toBe(mainTop);
  expect(await page.getByRole("combobox", { name: "Zoom", exact: true }).inputValue()).toBe(
    mainZoom
  );
  await page.getByRole("button", { name: "Pop out pinned page", exact: true }).click();
  const floating = page.getByRole("dialog", { name: "Pinned page", exact: true });
  await floating.waitFor();
  expect(await floating.getAttribute("aria-modal")).toBe("false");
  expect(await zoom.inputValue()).toBe("200");
  const handle = await page
    .getByRole("button", { name: "Move pinned viewer", exact: true })
    .boundingBox();
  const workspace = await page.locator(".reference-layout").boundingBox();
  if (!handle || !workspace) throw new Error("The floating viewer move handle is missing.");
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(workspace.x + workspace.width - 20, handle.y + handle.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  const field = page
    .getByRole("region", { name: "PDF page", exact: true })
    .getByRole("textbox", { name: "name", exact: true });
  await field.click();
  await field.fill("Edited with the reference floating");
  expect(await floating.isVisible()).toBe(true);
  await field.fill(applicant);
  await accessible(page);
  await page.getByRole("button", { name: "Dock pinned page", exact: true }).click();
  await page.getByRole("region", { name: "Pinned page", exact: true }).waitFor();
  expect(await zoom.inputValue()).toBe("200");
}
