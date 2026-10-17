import { expect } from "vitest";
import { type Page } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { unzipSync, strFromU8 } from "fflate";

export async function performanceExports(page: Page, pages: number) {
  const metrics: Record<string, number> = {};
  let started = performance.now();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const full = await downloadAction(page, "Download PDF", () => {
    metrics.fullExportMs = performance.now() - started;
  });
  expect((await PDFDocument.load(full)).getPageCount()).toBe(pages);
  started = performance.now();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("radio", { name: "Editing project", exact: true }).check();
  const project = await downloadAction(page, "Download editing project", () => {
    metrics.projectSaveMs = performance.now() - started;
  });
  const files = unzipSync(project);
  expect(JSON.parse(strFromU8(files["manifest.json"])).pages).toHaveLength(pages);
  await writeFile("test-results/performance/output.pdfree", project);
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Page numbers / group size" })
    .fill(String(Math.floor(pages / 2)));
  started = performance.now();
  const archive = await downloadAction(page, "Download 2 PDFs as ZIP", () => {
    metrics.splitMs = performance.now() - started;
  });
  const outputs = Object.values(unzipSync(archive));
  expect(outputs).toHaveLength(2);
  for (const output of outputs)
    expect((await PDFDocument.load(output)).getPageCount()).toBe(pages / 2);
  return metrics;
}
export async function downloadAction(page: Page, name: string, onReady: () => void = () => {}) {
  const ready = page.waitForEvent("download", { timeout: 120_000 });
  await page.getByRole("button", { name, exact: true }).click();
  const error = page.getByRole("alert").first();
  const download = await Promise.race([
    ready,
    error.waitFor({ state: "visible", timeout: 120_000 }).then(async () => {
      throw new Error(`Export rejected: ${await error.textContent()}`);
    }),
  ]);
  onReady();
  const path = await download.path();
  if (!path) throw new Error("The local browser did not create an export.");
  return new Uint8Array(await readFile(path));
}
