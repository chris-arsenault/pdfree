import { beforeEach, afterEach, expect, it } from "vitest";
import { type Root } from "react-dom/client";
import { page } from "vitest/browser";
import { PDFDocument } from "pdf-lib";
import { choiceFixture } from "../tooling/choiceFixture";
import { openEditor, editorDownload } from "../tooling/editorHarness";
import { deleteDraft } from "./services/drafts";
import { localPdf } from "./services/viewer";
import { readProject } from "./core/projects";

let root: Root | null = null;
beforeEach(() => deleteDraft());
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  await deleteDraft();
});

it("downloads editing projects for long filenames through the actual import/export controls", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const name = `${"a".repeat(201)}.pdf`;
  root = await openEditor(await pdf.save(), name);
  const restored = await readProject(
    await editorDownload("Download editing project", "application/octet-stream")
  );
  expect(restored.name).toBe(name);
  expect(restored.sources[0].name).toBe(name);
  expect(restored.pages).toHaveLength(1);
});

it("keeps unsupported field rotations out of projects and still exports valid fields", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  root = await openEditor(await pdf.save());
  await page.getByRole("button", { name: "Form field", exact: true }).click();
  await page
    .getByRole("region", { name: "PDF page", exact: true })
    .click({ position: { x: 100, y: 150 } });
  const rotation = page.getByRole("spinbutton", { name: "Rotation", exact: true });
  await rotation.fill("30");
  await expect.element(page.getByText(/Form fields support quarter-turn rotations/)).toBeVisible();
  let restored = await readProject(
    await editorDownload("Download editing project", "application/octet-stream")
  );
  expect(restored.pages[0].objects[0].rotation).toBe(0);
  await rotation.fill("90");
  await page.getByRole("combobox", { name: "Field type", exact: true }).selectOptions("radio");
  await expect.element(page.getByText(/Radio groups support 0° object rotation/)).toBeVisible();
  restored = await readProject(
    await editorDownload("Download editing project", "application/octet-stream")
  );
  expect(restored.pages[0].objects[0]).toMatchObject({ fieldKind: "text", rotation: 90 });
  const saved = await localPdf(await editorDownload("Download PDF", "application/pdf"));
  try {
    expect(
      (await (await saved.getPage(1)).getAnnotations()).filter((item) => item.fieldType === "Tx")
    ).toHaveLength(1);
  } finally {
    await saved.destroy();
  }
});

for (const kind of ["dropdown", "list"] as const) {
  it(`${kind} displays labels but exports values and correct flattened appearance`, async () => {
    root = await openEditor(await choiceFixture(kind));
    const select = page.getByRole("combobox", { name: "state", exact: true });
    await expect.element(select).toHaveValue("CA");
    expect(select.element().querySelector("option:checked")?.textContent).toBe("California");
    await select.selectOptions("NY");
    const saved = await localPdf(await editorDownload("Download PDF", "application/pdf"));
    try {
      const annotations = await (await saved.getPage(1)).getAnnotations();
      const choice = annotations.find((annotation) => annotation.fieldName === "state")!;
      expect(choice.fieldValue).toEqual(["NY"]);
      expect(choice.options).toEqual([
        { exportValue: "CA", displayValue: "California" },
        { exportValue: "NY", displayValue: "New York" },
      ]);
      expect(choice.combo).toBe(kind === "dropdown");
      expect(choice.fieldFlags).toBe(kind === "dropdown" ? 131072 : 0);
    } finally {
      await saved.destroy();
    }
    const flattened = await localPdf(
      await editorDownload("Download PDF", "application/pdf", "Export", true)
    );
    try {
      const content = await (await flattened.getPage(1)).getTextContent();
      const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      expect(text).toContain("New York");
      if (kind === "dropdown") expect(text).not.toContain("NY");
    } finally {
      await flattened.destroy();
    }
  });
}

it("aligns native fields with the independent visible viewport when crop exceeds media", async () => {
  const pdf = await PDFDocument.create(),
    original = pdf.addPage([600, 800]);
  original.setCropBox(-50, -100, 500, 650);
  pdf
    .getForm()
    .createTextField("aligned")
    .addToPage(original, { x: 20, y: 100, width: 120, height: 30 });
  const bytes = await pdf.save();
  root = await openEditor(bytes);
  const reader = await localPdf(bytes.slice());
  try {
    const independent = await reader.getPage(1);
    expect(independent.view).toEqual([0, 0, 450, 550]);
    const annotation = (await independent.getAnnotations()).find(
      (item) => item.fieldName === "aligned"
    )!;
    for (const rotation of [0, 90, 180, 270]) {
      const viewport = independent.getViewport({ scale: 1, rotation });
      const surface = document.querySelector<HTMLElement>(".page-surface")!.getBoundingClientRect();
      const control = document
        .querySelector<HTMLElement>(".native-widget")!
        .getBoundingClientRect();
      const rect = viewport.convertToViewportRectangle(annotation.rect);
      const scale = surface.width / viewport.width;
      expect(surface.height / scale).toBeCloseTo(viewport.height, 1);
      expect(control.x - surface.x).toBeCloseTo(Math.min(rect[0], rect[2]) * scale, 1);
      expect(control.y - surface.y).toBeCloseTo(Math.min(rect[1], rect[3]) * scale, 1);
      if (rotation !== 270) await page.getByRole("button", { name: "Rotate", exact: true }).click();
    }
  } finally {
    await reader.destroy();
  }
});
