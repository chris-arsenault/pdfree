import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { type Root } from "react-dom/client";
import { PDFDocument } from "pdf-lib";
import { TextLayer as PdfTextLayer } from "pdfjs-dist";
import { page } from "vitest/browser";
import { formFixture } from "./core/fixtures";
import { deleteDraft } from "./services/drafts";
import { openEditor } from "../tooling/editorHarness";

const offline = vi.hoisted(() => ({
  options: {} as { onNeedRefresh: () => void; onRegisterError: (error: Error) => void },
  update: vi.fn(async () => {}),
  failDraft: false,
}));
vi.mock("./services/drafts", async (importOriginal) => {
  const original = await importOriginal<typeof import("./services/drafts")>();
  return {
    ...original,
    saveDraft: (...args: Parameters<typeof original.saveDraft>) =>
      offline.failDraft
        ? Promise.reject(new DOMException("Synthetic storage quota", "QuotaExceededError"))
        : original.saveDraft(...args),
  };
});
vi.mock("virtual:pwa-register", () => ({
  registerSW: (options: typeof offline.options) => {
    offline.options = options;
    return offline.update;
  },
}));

let root: Root | null = null;
beforeEach(async () => {
  PdfTextLayer.cleanup();
  await deleteDraft();
  offline.update.mockClear();
  offline.failDraft = false;
});
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  await deleteDraft();
  await page.viewport(1280, 720);
});

async function checkRails() {
  const footer = document.querySelector<HTMLElement>(".app-footer")!;
  const header = document.querySelector<HTMLElement>(".app-header")!;
  const scrolling = document.scrollingElement!;
  await expect
    .poll(() => footer.getBoundingClientRect().height)
    .toBeLessThanOrEqual(window.innerWidth <= 480 ? 104 : 56);
  expect(scrolling.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  expect(scrolling.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
  for (const rail of [header, footer]) {
    const bounds = rail.getBoundingClientRect();
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(rail.scrollWidth).toBeLessThanOrEqual(rail.clientWidth);
  }
  await expect
    .element(page.getByRole("button", { name: "Open options", exact: true }))
    .toBeVisible();
  await expect.element(page.getByRole("button", { name: "Fit page", exact: true })).toBeVisible();
  expect(document.querySelector(".app-footer .zoom-controls")).toBeNull();
}

it("keeps the PDF.js text measurement canvas out of the viewport layout", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("A PDF with selectable source text");
  root = await openEditor(await pdf.save(), `${"Long document name ".repeat(15)}.pdf`);
  await expect
    .poll(() => document.querySelector(".textLayer")?.textContent, { timeout: 5000 })
    .toContain("selectable source text");
  await expect.poll(() => document.querySelector(".hiddenCanvasElement")).not.toBeNull();
  expect(document.scrollingElement!.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
  await checkRails();
});

it("keeps an available update compact and scrolls zoomed pages without moving the rails", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("button", { name: "Hide pages", exact: true }).click();
  offline.options.onNeedRefresh();
  await expect.element(page.getByRole("button", { name: "Update", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Zoom", exact: true }).selectOptions("300");
  for (const [width, height] of [
    [1280, 720],
    [1024, 600],
    [768, 620],
    [390, 700],
    [320, 600],
  ]) {
    await page.viewport(width, height);
    await checkRails();
    const area = document.querySelector<HTMLElement>(".page-scroll")!;
    const footer = document.querySelector<HTMLElement>(".app-footer")!;
    const before = footer.getBoundingClientRect().top;
    area.scrollTo(200, 200);
    await expect.poll(() => area.scrollTop).toBeGreaterThan(0);
    await expect.poll(() => area.scrollLeft).toBeGreaterThan(0);
    expect(window.scrollY).toBe(0);
    expect(footer.getBoundingClientRect().top).toBe(before);
    if (width === 1280 || width === 320)
      await page.screenshot({ path: `../test-results/compact-rails-${width}.png` });
  }
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Update and reload?", exact: true }))
    .toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(offline.update).not.toHaveBeenCalled();
  offline.update.mockRejectedValueOnce(new Error("Synthetic update failure"));
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await page.getByRole("button", { name: "Update and reload", exact: true }).click();
  expect(offline.update).toHaveBeenCalledWith(true);
  await page.getByRole("button", { name: "Offline unavailable", exact: true }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Offline unavailable", exact: true }))
    .toHaveTextContent("The update could not load. Your current editor remains available.");
  await page.getByRole("button", { name: "Offline unavailable", exact: true }).click();
  await checkRails();
  await expect.element(page.getByRole("button", { name: "Update", exact: true })).toBeEnabled();
});

it("keeps offline installation errors accessible without expanding the footer", async () => {
  root = await openEditor(await formFixture());
  offline.options.onRegisterError(new Error("Synthetic installation failure"));
  await page.viewport(768, 620);
  await checkRails();
  await page.getByRole("button", { name: "Offline unavailable", exact: true }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Offline unavailable", exact: true }))
    .toHaveTextContent("Offline installation is unavailable in this browser.");
});

it("keeps storage failures compact while exposing the full recovery advice", async () => {
  offline.failDraft = true;
  root = await openEditor(await formFixture());
  await page.getByRole("button", { name: "Hide pages", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Draft not saved", exact: true }))
    .toBeVisible();
  for (const width of [1280, 768, 320]) {
    await page.viewport(width, 720);
    await checkRails();
  }
  await page.getByRole("button", { name: "Draft not saved", exact: true }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Draft not saved", exact: true }))
    .toHaveTextContent("Download an editing project; browser storage may be full.");
});
