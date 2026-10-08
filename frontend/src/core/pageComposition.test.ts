import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, degrees } from "pdf-lib";
import { appendSource, importPdf } from "./importPdf";
import { defaultObject, emptyDocument } from "./model";
import { exportPdf, canPreserveCatalog } from "./exportPdf";
import { insertBlank, removePages, rotatePages } from "./pageOperations";
import { writeProject, readProject } from "./projects";

describe("blank page geometry", () => {
  for (const rotation of [0, 90, 180, 270])
    for (const origin of [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: -50, y: -100 },
    ])
      it(`saves a blank page at ${rotation} degrees after crop origin ${origin.x},${origin.y}`, async () => {
        const original = await PDFDocument.create();
        original.addPage([600, 800]).setCropBox(origin.x, origin.y, 500, 650);
        let document = appendSource(
          emptyDocument(),
          await importPdf(await original.save(), "cropped.pdf")
        );
        document = insertBlank(document, document.pages[0].id);
        document = rotatePages(document, [document.pages[1].id], rotation);
        const blank = document.pages[1];
        const width = origin.x < 0 ? 450 : 500,
          height = origin.y < 0 ? 550 : 650;
        expect(blank.box).toEqual({ x: 0, y: 0, width, height });
        blank.objects.push({
          ...defaultObject("text", { x: 10, y: height - 40 }),
          text: "Top of blank page",
          width: 200,
        });
        const saved = await PDFDocument.load(await exportPdf(document));
        expect(saved.getPage(1).getCropBox()).toEqual(blank.box);
        expect(saved.getPage(1).getMediaBox()).toEqual(blank.box);
        expect(saved.getPage(1).getRotation().angle).toBe(rotation);
        expect(saved.getPage(0).getCropBox()).toEqual({ ...origin, width: 500, height: 650 });
      });

  it("preserves nonzero blank origins in existing version 1 projects", async () => {
    const document = emptyDocument();
    document.pages.push({
      id: "legacy-blank",
      sourceId: "",
      sourceIndex: 0,
      comments: [],
      rotation: 90,
      box: { x: 50, y: 100, width: 500, height: 650 },
      objects: [],
    });
    const restored = await readProject(writeProject(document));
    const saved = await PDFDocument.load(await exportPdf(restored));
    expect(saved.getPage(0).getMediaBox()).toEqual(document.pages[0].box);
    expect(saved.getPage(0).getCropBox()).toEqual(document.pages[0].box);
    expect(saved.getPage(0).getRotation().angle).toBe(90);
  });
});

describe("catalog preservation depends on the exported pages", () => {
  for (const catalogKey of ["Outlines", "Names", "StructTreeRoot"])
    for (const targetFirst of [true, false])
      it(`retains ${catalogKey} after removing the ${targetFirst ? "later" : "earlier"} source`, async () => {
        const target = await PDFDocument.create();
        target.addPage([600, 800]);
        target.addPage([500, 700]);
        target.catalog.set(PDFName.of(catalogKey), target.context.obj({}));
        const other = await PDFDocument.create();
        other.addPage([300, 400]);
        const first = await importPdf(await (targetFirst ? target : other).save(), "first.pdf");
        const second = await importPdf(await (targetFirst ? other : target).save(), "second.pdf");
        let document = appendSource(appendSource(emptyDocument(), first), second);
        const retainedSource = targetFirst ? first.source : second.source;
        document = removePages(
          document,
          document.pages
            .filter((page) => page.sourceId !== retainedSource.id)
            .map((page) => page.id)
        );
        expect(document.sources).toHaveLength(2);
        expect(canPreserveCatalog(document, document.pages)).toBe(true);
        document.pages.reverse();
        const saved = await PDFDocument.load(await exportPdf(document));
        expect(saved.catalog.has(PDFName.of(catalogKey))).toBe(true);
        expect(saved.getPages().map((page) => page.getWidth())).toEqual([500, 600]);
      });

  it("still rejects partial extraction that would discard a retained catalog", async () => {
    const original = await PDFDocument.create();
    original.addPage();
    original.addPage();
    original.catalog.set(PDFName.of("Outlines"), original.context.obj({}));
    const document = appendSource(
      emptyDocument(),
      await importPdf(await original.save(), "protected.pdf")
    );
    expect(canPreserveCatalog(document, [document.pages[0]])).toBe(false);
    await expect(exportPdf(document, false, [document.pages[0].id])).rejects.toThrow(
      "document bookmarks"
    );
  });
});

describe("canonical imported rotations", () => {
  for (const [input, expected] of [
    [-90, 270],
    [-180, 180],
    [-270, 90],
    [-360, 0],
    [360, 0],
    [450, 90],
    [-450, 270],
  ])
    it(`normalizes ${input} degrees to ${expected} and supports editable-project round trips`, async () => {
      const original = await PDFDocument.create();
      original.addPage([600, 800]).setRotation(degrees(input));
      const bytes = await original.save();
      const untouched = Uint8Array.from(bytes);
      const document = appendSource(emptyDocument(), await importPdf(bytes, "rotation.pdf"));
      expect(document.pages[0].rotation).toBe(expected);
      expect(bytes).toEqual(untouched);
      const restored = await readProject(writeProject(document));
      expect(restored.pages[0].rotation).toBe(expected);
      const saved = await PDFDocument.load(await exportPdf(restored));
      expect(saved.getPage(0).getRotation().angle).toBe(expected);
    });
});
