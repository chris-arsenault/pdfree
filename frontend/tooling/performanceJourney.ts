import { expect } from "vitest";
import { type Page } from "playwright";
import { PDFDocument } from "pdf-lib";
import { savedPdfText } from "./pdfText";
import { downloadAction } from "./performanceExports";

export async function documentJourney(page: Page, path: string, pages: number) {
  const metrics: Record<string, number> = {};
  let started = performance.now();
  await page.locator(".drop-card input").setInputFiles(path);
  const total = new Intl.NumberFormat("en").format(pages);
  await page.getByText(`PAGE 1 OF ${total}`, { exact: true }).waitFor();
  await page.locator(".page-surface .textLayer span").first().waitFor();
  await expect
    .poll(() => page.getByRole("button", { name: "Text", exact: true }).isEnabled())
    .toBe(true);
  metrics.openTextReadyMs = performance.now() - started;
  started = performance.now();
  for (const number of [pages, Math.ceil(pages / 2), 1, pages, 1]) {
    await page.locator(".page-jump").fill(String(number));
    await page
      .getByText(`PAGE ${new Intl.NumberFormat("en").format(number)} OF ${total}`, { exact: true })
      .waitFor();
  }
  metrics.navigationUiMs = (performance.now() - started) / 5;
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.locator(".page-surface").click({ position: { x: 80, y: 100 } });
  const text = page.getByRole("textbox", { name: "Object text" });
  started = performance.now();
  for (let i = 0; i < 20; i++) {
    await text.fill(`Edit ${i}`);
    await expect.poll(() => page.locator(".placed-object").textContent()).toContain(`Edit ${i}`);
  }
  metrics.editMs = (performance.now() - started) / 20;
  started = performance.now();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(() => text.inputValue()).toBe("Edit 18");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect.poll(() => text.inputValue()).toBe("Edit 19");
  metrics.historyMs = performance.now() - started;
  started = performance.now();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Extract", exact: true }).click();
  const bytes = await downloadAction(page, "Download PDF", () => {
    metrics.extractMs = performance.now() - started;
  });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  expect(await savedPdfText(bytes)).toContain("Edit 19");
  return metrics;
}
