import { expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import { appendSource, importPdf } from "./importPdf";
import { addComment, commentPointAt, createComment } from "./comments";
import { emptyDocument } from "./model";
import { exportPdf } from "./exportPdf";
import { toPdf, displayBox } from "./coordinates";
import { rotatePages } from "./pageOperations";
import { localPdf } from "../services/viewer";

it.each([0, 90, 180, 270])(
  "aligns editor and native note rectangles at rotation %i on cropped pages",
  async (rotation) => {
    const source = await PDFDocument.create();
    source.addPage([600, 800]).setCropBox(50, 100, 500, 650);
    source.getPage(0).setRotation(degrees(rotation));
    let document = appendSource(emptyDocument(), await importPdf(await source.save(), "crop.pdf"));
    const page = document.pages[0];
    const note = createComment(
      commentPointAt(toPdf({ x: 100, y: 120 }, page), page),
      "Same bounds",
      "Ada"
    );
    document = addComment(document, page.id, note);
    expect(displayBox({ ...note, rotation: 0 }, page)).toMatchObject({
      x: 100,
      y: 120,
      width: 24,
      height: 24,
    });
    for (const angle of [0, 90]) {
      const current = rotatePages(document, [page.id], angle);
      const pdf = await localPdf(await exportPdf(current));
      try {
        const output = await pdf.getPage(1);
        const annotation = (await output.getAnnotations()).find((item) => item.subtype === "Text")!;
        const rect = output.getViewport({ scale: 1 }).convertToViewportRectangle(annotation.rect);
        const expected = displayBox({ ...note, rotation: 0 }, current.pages[0]);
        expect(Math.min(rect[0], rect[2])).toBeCloseTo(expected.x);
        expect(Math.min(rect[1], rect[3])).toBeCloseTo(expected.y);
        expect(Math.abs(rect[2] - rect[0])).toBeCloseTo(expected.width);
        expect(Math.abs(rect[3] - rect[1])).toBeCloseTo(expected.height);
        const restored = await importPdf(await exportPdf(current), "saved.pdf");
        expect(restored.pages[0].comments[0]).toMatchObject({
          x: note.x,
          y: note.y,
          width: 24,
          height: 24,
        });
      } finally {
        await pdf.destroy();
      }
    }
  }
);
