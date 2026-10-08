import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { userEvent, page } from "vitest/browser";
import { PDFDocument, degrees } from "pdf-lib";
import App from "./App";
import { localPdf } from "./services/viewer";
import { deleteDraft } from "./services/drafts";
import { readProject } from "./core/projects";
import { formFixture } from "./core/fixtures";
import { rasterLimits } from "./services/rasterBudget";
import "./styles.css";

let root: Root | null = null;
beforeEach(async () => {
  await deleteDraft();
});
afterEach(async () => {
  root?.unmount();
  root = null;
  vi.restoreAllMocks();
  document.body.replaceChildren();
  await deleteDraft();
});

async function open(bytes: Uint8Array) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(App));
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".drop-card input")!,
    new File([Uint8Array.from(bytes)], "quality.pdf", { type: "application/pdf" })
  );
  await expect.element(page.getByRole("main", { name: "Document editor" })).toBeVisible();
}

async function download(buttonName: string, mime: string, action = "Export") {
  const create = URL.createObjectURL.bind(URL);
  const files: Promise<ArrayBuffer>[] = [];
  const spy = vi.spyOn(URL, "createObjectURL").mockImplementation((object) => {
    if (object instanceof Blob && object.type === mime) files.push(object.arrayBuffer());
    return create(object);
  });
  try {
    if (action === "Extract") await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("button", { name: action, exact: true }).click();
    await page.getByRole("button", { name: buttonName, exact: true }).click();
    await expect.poll(() => files.length, { timeout: 10_000 }).toBe(1);
    return new Uint8Array(await files[0]);
  } finally {
    spy.mockRestore();
  }
}

it("extracts checkbox-selected pages in document order rather than click order", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([100, 200]);
  pdf.addPage([300, 400]);
  await open(await pdf.save());
  await page.getByRole("checkbox", { name: "Select page 2", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select page 1", exact: true }).click();
  const saved = await localPdf(await download("Download PDF", "application/pdf", "Extract"));
  try {
    expect((await saved.getPage(1)).view).toEqual([0, 0, 100, 200]);
    expect((await saved.getPage(2)).view).toEqual([0, 0, 300, 400]);
  } finally {
    await saved.destroy();
  }
});

it("clears imported dropdown and single-select list placeholders in real saved bytes", async () => {
  const pdf = await PDFDocument.create();
  const original = pdf.addPage([612, 792]);
  const dropdown = pdf.getForm().createDropdown("destination");
  dropdown.addOptions(["East", "West"]);
  dropdown.select("East");
  dropdown.addToPage(original, { x: 50, y: 600, width: 160, height: 30 });
  const list = pdf.getForm().createOptionList("office");
  list.addOptions(["North", "South"]);
  list.select("North");
  list.addToPage(original, { x: 50, y: 500, width: 160, height: 50 });
  await open(await pdf.save());
  await page.getByRole("combobox", { name: "destination", exact: true }).selectOptions("");
  await page.getByRole("combobox", { name: "office", exact: true }).selectOptions("");
  const saved = await localPdf(await download("Download PDF", "application/pdf"));
  try {
    const annotations = await (await saved.getPage(1)).getAnnotations();
    const choices = annotations.filter((annotation) => annotation.fieldType === "Ch");
    expect(choices.map((annotation) => annotation.fieldValue)).toEqual([[], []]);
    expect(
      choices.flatMap((annotation) =>
        annotation.options.map((option: { exportValue: string }) => option.exportValue)
      )
    ).toEqual(["East", "West", "North", "South"]);
  } finally {
    await saved.destroy();
  }
});

it("keeps a rotated native text control inside its annotation on each page rotation", async () => {
  const pdf = await PDFDocument.create();
  const original = pdf.addPage([612, 792]);
  const field = pdf.getForm().createTextField("rotated name");
  field.addToPage(original, { x: 100, y: 200, width: 150, height: 30, rotate: degrees(90) });
  const annotation = field.acroField.getWidgets()[0].getRectangle();
  await open(await pdf.save());
  await page.getByRole("textbox", { name: "rotated name", exact: true }).fill("Aligned");
  for (const rotation of [0, 90, 180, 270]) {
    const surface = document.querySelector<HTMLElement>(".page-surface")!;
    const input = document.querySelector<HTMLElement>(".native-widget")!;
    const surfaceBounds = surface.getBoundingClientRect();
    const scale = surfaceBounds.width / (rotation % 180 ? 792 : 612);
    const expected = [
      [annotation.x, 792 - annotation.y - annotation.height, annotation.width, annotation.height],
      [annotation.y, annotation.x, annotation.height, annotation.width],
      [612 - annotation.x - annotation.width, annotation.y, annotation.width, annotation.height],
      [
        792 - annotation.y - annotation.height,
        612 - annotation.x - annotation.width,
        annotation.height,
        annotation.width,
      ],
    ][rotation / 90];
    const actual = input.getBoundingClientRect();
    expect(actual.x - surfaceBounds.x).toBeCloseTo(expected[0] * scale, 1);
    expect(actual.y - surfaceBounds.y).toBeCloseTo(expected[1] * scale, 1);
    expect(actual.width).toBeCloseTo(expected[2] * scale, 1);
    expect(actual.height).toBeCloseTo(expected[3] * scale, 1);
    if (rotation !== 270) await page.getByRole("button", { name: "Rotate", exact: true }).click();
  }
  const saved = await localPdf(await download("Download PDF", "application/pdf"));
  try {
    const annotations = await (await saved.getPage(1)).getAnnotations();
    expect(
      annotations.find((annotation) => annotation.fieldName === "rotated name")?.fieldValue
    ).toBe("Aligned");
  } finally {
    await saved.destroy();
  }
});

it("edits overlay text without reallocating original page or thumbnail canvases", async () => {
  await open(await formFixture());
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await userEvent.click(document.querySelector<HTMLElement>(".page-surface")!, {
    position: { x: 80, y: 100 },
  });
  await expect.element(page.getByRole("textbox", { name: "Object text" })).toBeVisible();
  const resize = vi.spyOn(HTMLCanvasElement.prototype, "width", "set");
  const backgroundResized = () =>
    resize.mock.contexts.some(
      (context) => context instanceof HTMLCanvasElement && context.classList.contains("pdf-canvas")
    );
  await page.getByRole("textbox", { name: "Object text" }).fill("An overlay edit");
  expect(backgroundResized()).toBe(false);
  await page.getByRole("spinbutton", { name: "Font size", exact: true }).fill("16");
  expect(backgroundResized()).toBe(false);
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  expect(backgroundResized()).toBe(true);
});

it("keeps invalid name and numeric drafts out of downloadable editing projects", async () => {
  await open(await formFixture());
  await page.getByRole("button", { name: "Document", exact: true }).click();
  await page.getByRole("textbox", { name: "Document name", exact: true }).fill("");
  await expect.element(page.getByText("Give the document a name.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await userEvent.click(document.querySelector<HTMLElement>(".page-surface")!, {
    position: { x: 80, y: 100 },
  });
  await page.getByRole("spinbutton", { name: "Font size", exact: true }).fill("1001");
  await expect
    .element(page.getByText("Font size must be between 1 and 1000.", { exact: false }))
    .toBeVisible();
  const restored = await readProject(
    await download("Download editing project", "application/octet-stream")
  );
  expect(restored.name).toBe("quality.pdf");
  expect(restored.pages[0].objects[0].fontSize).toBe(14);
});

it("rejects oversized PNG pages before creating an export raster", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([10_000, 10_000]);
  await open(await pdf.save());
  const width = vi.spyOn(HTMLCanvasElement.prototype, "width", "set");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "Page images (PNG ZIP)", exact: true }).click();
  await expect
    .element(page.getByRole("alert"))
    .toHaveTextContent("too large for PNG export at 108 dpi");
  expect(width.mock.calls.every(([value]) => value <= rasterLimits.viewerEdge)).toBe(true);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  expect(
    (await PDFDocument.load(await download("Download PDF", "application/pdf"))).getPageCount()
  ).toBe(1);
});
