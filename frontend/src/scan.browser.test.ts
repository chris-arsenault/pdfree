import { afterEach, beforeEach, expect, it } from "vitest";
import { type Root } from "react-dom/client";
import { PDFDocument } from "pdf-lib";
import { page, userEvent } from "vitest/browser";
import { deleteDraft } from "./services/drafts";
import { openEditor } from "../tooling/editorHarness";

let root: Root | null = null;
beforeEach(async () => {
  await deleteDraft();
});
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  await deleteDraft();
});

/**
 * Grey-paper text scans: each page tilted by its angle (positive leans the
 * text up to the right) with a dark scanner edge along the left side.
 */
async function skewedScan(tilts: number[], text = "Quarterly maintenance report") {
  const pdf = await PDFDocument.create();
  for (const tilt of tilts) {
    const canvas = document.createElement("canvas");
    canvas.width = 1275;
    canvas.height = 1650;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#c9c6bb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((-tilt * Math.PI) / 180);
    context.translate(-canvas.width / 2, -canvas.height / 2);
    context.fillStyle = "#6a6862";
    context.font = "34px Arial";
    for (let line = 0; line < 30; line++)
      context.fillText(`${text} line ${line + 1} with steady results`, 150, 220 + line * 44);
    context.restore();
    context.fillStyle = "#151515";
    context.fillRect(0, 0, 60, canvas.height);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((value) => resolve(value!), "image/jpeg", 0.92)
    );
    const image = await pdf.embedJpg(await blob.arrayBuffer());
    pdf.addPage([612, 792]).drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
    canvas.width = canvas.height = 0;
  }
  return pdf.save();
}

it("offers scan tools from the toolbar and a notice on scanned pages", async () => {
  root = await openEditor(await skewedScan([0]), "Scan.pdf");
  const tools = page.getByRole("group", { name: "Scan tools", exact: true });
  await expect.element(tools.getByRole("button", { name: "Recognize text" })).toBeVisible();
  await expect.element(tools.getByRole("button", { name: "Clean up scans" })).toBeVisible();
  await expect.element(page.getByText(/This page is a scanned image/)).toBeVisible();
  await page.getByRole("button", { name: "Recognize text", exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Recognize scanned text", exact: true });
  await expect.element(dialog.getByText("will be recognized")).toBeVisible();
  await expect
    .element(dialog.getByRole("button", { name: "Recognize 1 page(s)", exact: true }))
    .toBeEnabled();
});

it("analyzes each scanned page, previews the result and applies detected corrections", async () => {
  root = await openEditor(await skewedScan([3, -2]), "Skewed.pdf");
  await page.getByRole("button", { name: "Clean up scan", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Clean up scans", exact: true });
  await expect.element(dialog.getByText(/^Tilted 3\.\d+° counter-clockwise\.$/)).toBeVisible();
  await expect.element(dialog.getByText(/^Paper is \d+% bright/)).toBeVisible();
  await expect.element(dialog.getByText(/^Text is faded/)).toBeVisible();
  await expect.element(dialog.getByText("Dark scanner edge along the left side.")).toBeVisible();
  // The trim is measured after straightening, which widens the edge band into a wedge.
  await expect.element(dialog.getByText(/^Trims left \d+ pt/)).toBeVisible();
  const preview = document.querySelector<HTMLCanvasElement>(".scan-preview canvas")!;
  expect(preview.width).toBeGreaterThan(0);
  await dialog.getByRole("button", { name: "Next page", exact: true }).click();
  await expect.element(dialog.getByText(/^Tilted 2\.\d+° clockwise\.$/)).toBeVisible();
  await dialog.getByRole("button", { name: "Apply to 2 page(s)", exact: true }).click();
  await expect
    .element(dialog.getByText(/^Cleaned 2 page\(s\): 2 straightened, .*2 darkened, 2 trimmed/))
    .toBeVisible();
  await expect
    .element(dialog.getByRole("button", { name: "Restore 2 original page(s)", exact: true }))
    .toBeVisible();
}, 60_000);

it("switches to shared settings when a value is adjusted and trims by dragging edges", async () => {
  root = await openEditor(await skewedScan([1.5, 1.5]), "Shared.pdf");
  await page.getByRole("button", { name: "Clean up scan", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Clean up scans", exact: true });
  await expect.element(dialog.getByText(/^Tilted 1\.\d+° counter-clockwise\.$/)).toBeVisible();
  await expect.element(dialog.getByRole("radio", { name: /Detect for each page/ })).toBeChecked();
  await dialog.getByRole("button", { name: "More contrast", exact: true }).click();
  await expect.element(dialog.getByRole("radio", { name: /Same settings/ })).toBeChecked();
  const top = dialog.getByRole("slider", { name: "Trim top edge", exact: true });
  (top.element() as HTMLElement).focus();
  await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowDown}{ArrowDown}{/Shift}");
  await expect.element(top).toHaveAttribute("aria-valuenow", "30");
  await expect.element(dialog.getByText(/^Trims .*top 30 pt/)).toBeVisible();
}, 60_000);
