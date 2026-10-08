import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument } from "./model";
import { insertBlank } from "./pageOperations";
import { writeProject, readProject } from "./projects";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

it("uses the CropBox intersection with MediaBox for editing and inserted blank pages", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([600, 800]).setCropBox(-50, -100, 500, 650);
  const imported = await importPdf(await pdf.save(), "clipped.pdf");
  expect(imported.pages[0].box).toEqual({ x: 0, y: 0, width: 450, height: 550 });
  const document = appendSource(emptyDocument(), imported);
  expect(insertBlank(document, document.pages[0].id).pages[1].box).toEqual({
    x: 0,
    y: 0,
    width: 450,
    height: 550,
  });
});

it("repairs source-derived geometry from older projects without moving PDF-coordinate objects", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([600, 800]).setCropBox(-50, -100, 500, 650);
  const doc = appendSource(emptyDocument(), await importPdf(await pdf.save(), "old.pdf"));
  doc.pages[0].box = { x: -50, y: -100, width: 500, height: 650 };
  const snapshot = structuredClone(doc);
  const files = unzipSync(writeProject(doc));
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.version = 3;
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  const restored = await readProject(zipSync(files));
  expect(restored.pages[0].box).toEqual({ x: 0, y: 0, width: 450, height: 550 });
  expect(restored.pages[0].id).toBe(doc.pages[0].id);
  expect(restored.sources[0].bytes).toEqual(doc.sources[0].bytes);
  expect(doc).toEqual(snapshot);
});

it("uses MediaBox when CropBox has no visible intersection", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([600, 800]).setCropBox(700, 900, 50, 60);
  expect((await importPdf(await pdf.save(), "empty-intersection.pdf")).pages[0].box).toEqual({
    x: 0,
    y: 0,
    width: 600,
    height: 800,
  });
});
