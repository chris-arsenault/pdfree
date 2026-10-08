import { describe, expect, it } from "vitest";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  StandardFonts,
  decodePDFRawStream,
  PDFRawStream,
} from "pdf-lib";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument, newId, type EditorDocument } from "./model";
import { exportPdf } from "./exportPdf";
import { readProject, writeProject } from "./projects";
import { duplicatePages, movePage, removePages, insertBlank } from "./pageOperations";
import { unzipSync, strFromU8 } from "fflate";
import { pageRules, ruleText } from "./pageRules";
import { adjustedDestination } from "./utilityNavigation";

async function fixture() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage([612, 792]).drawText("First page", { font });
  pdf.addPage([300, 500]).drawText("Second page", { font });
  const destination = pdf.context.obj([pdf.getPage(1).ref, PDFName.of("XYZ"), 40, 450, null]);
  const outline = pdf.context.obj({ Title: pdf.context.obj("Chapter two"), Dest: destination });
  const outlineRef = pdf.context.register(outline);
  const root = pdf.context.register(
    pdf.context.obj({ Type: "Outlines", First: outlineRef, Last: outlineRef, Count: 1 })
  );
  outline.set(PDFName.of("Parent"), root);
  pdf.catalog.set(PDFName.of("Outlines"), root);
  pdf.getPage(0).node.set(
    PDFName.of("Annots"),
    pdf.context.obj([
      pdf.context.register(
        pdf.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [30, 30, 100, 50],
          Dest: destination,
        })
      ),
    ])
  );
  return appendSource(emptyDocument(), await importPdf(await pdf.save(), "Navigation.pdf"));
}
describe("durable document utilities", () => {
  it("remaps outlines and internal links to actual output pages on reorder", async () => {
    const document = await fixture();
    expect(document.sources[0].structuralWarnings).toEqual([]);
    const reordered = movePage(document, document.pages[1].id, 0);
    const saved = await PDFDocument.load(await exportPdf(reordered));
    const first = saved.catalog
      .lookup(PDFName.of("Outlines"), PDFDict)
      .lookup(PDFName.of("First"), PDFDict);
    expect(first.lookup(PDFName.of("Dest"), PDFArray).get(0).toString()).toBe(
      saved.getPage(0).ref.toString()
    );
    const link = saved.getPage(1).node.Annots()!.lookup(0, PDFDict);
    expect(link.lookup(PDFName.of("Dest"), PDFArray).get(0).toString()).toBe(
      saved.getPage(0).ref.toString()
    );
  });
  it("clears destinations whose page was removed and retains the link annotation", async () => {
    const document = await fixture();
    const removed = removePages(document, [document.pages[1].id]);
    const saved = await PDFDocument.load(await exportPdf(removed));
    expect(saved.catalog.has(PDFName.of("Outlines"))).toBe(false);
    expect(saved.getPage(0).node.Annots()!.lookup(0, PDFDict).has(PDFName.of("Dest"))).toBe(false);
  });
  it("writes explicit v4 utility records and preserves crop and recognition on reopen", async () => {
    const document = await fixture();
    document.pages[0].box = { x: 20, y: 30, width: 550, height: 700 };
    document.pages[0].recognition = {
      engine: "tesseract-7",
      language: "eng",
      words: [{ text: "Recognized", x: 80, y: 500, width: 90, height: 14, confidence: 92 }],
    };
    const bytes = writeProject(document),
      manifest = JSON.parse(strFromU8(unzipSync(bytes)["manifest.json"])) as { version: number };
    expect(manifest.version).toBe(4);
    const reopened = await readProject(bytes);
    expect(reopened.pages[0].box).toEqual(document.pages[0].box);
    expect(reopened.pages[0].recognition).toEqual(document.pages[0].recognition);
    expect(reopened.bookmarks).toEqual(document.bookmarks);
  });
  it("exports recognition as invisible text and leaves originals immutable", async () => {
    const document = await fixture(),
      original = document.sources[0].bytes.slice();
    document.pages[0].recognition = {
      engine: "tesseract-7",
      language: "eng",
      words: [{ text: "Recognized", x: 80, y: 500, width: 90, height: 14, confidence: 92 }],
    };
    const saved = await PDFDocument.load(await exportPdf(document));
    const contents = saved.getPage(0).node.Contents() as PDFArray;
    const operators = Array.from({ length: contents.size() }, (_, index) =>
      new TextDecoder().decode(decodePDFRawStream(contents.lookup(index, PDFRawStream)).decode())
    ).join("\n");
    expect(operators).toContain("3 Tr");
    expect(document.sources[0].bytes).toEqual(original);
  });
  it("rejects cyclic bookmark hierarchies before saving", async () => {
    const document = await fixture();
    document.bookmarks![0].parentId = document.bookmarks![0].id;
    expect(() => writeProject(document)).toThrow("hierarchy");
  });
  it("duplicates recognized text with independent page identity", async () => {
    const document = await fixture();
    document.pages[0].recognition = { engine: "tesseract-7", language: "eng", words: [] };
    const copied = duplicatePages(document, [document.pages[0].id]);
    expect(copied.pages[1].id).not.toBe(document.pages[0].id);
    expect(copied.pages[1].recognition).toEqual(document.pages[0].recognition);
  });
  it("keeps numbering dynamic through reorder and duplication and removes emptied scopes", async () => {
    const document = await fixture();
    document.rules = [utilityRule(document)];
    const reordered = movePage(document, document.pages[1].id, 0);
    expect(ruleText(reordered, reordered.pages[0], reordered.rules![0])).toBe("BATES-0001");
    const copied = duplicatePages(reordered, [reordered.pages[0].id]);
    expect(ruleText(copied, copied.pages[2], copied.rules![0])).toBe("BATES-0003");
    const removed = removePages(insertBlank(copied, copied.pages[2].id), copied.rules![0].pageIds);
    expect(removed.rules).toEqual([]);
    document.rules![0].pageIds = [];
    expect(pageRules(document, document.pages[1])).toHaveLength(1);
  });
  it("transforms positioned destinations during deskew and rejects ambiguous locations", async () => {
    const document = await fixture(),
      page = document.pages[1];
    page.scan = { assetId: "scan", angle: 5, contrast: 1, background: 0 };
    const target = document.bookmarks![0].destination;
    expect(adjustedDestination(target, page).coordinates).not.toEqual(target.coordinates);
    expect(() =>
      adjustedDestination({ ...target, mode: "FitH", coordinates: [450] }, page)
    ).toThrow("positioned");
    expect(adjustedDestination({ ...target, mode: "Fit", coordinates: [] }, page).mode).toBe("Fit");
  });
  it("rejects malformed destination arity in portable projects", async () => {
    const document = await fixture();
    document.bookmarks![0].destination.coordinates = [];
    expect(() => writeProject(document)).toThrow("coordinates");
  });
});
const utilityRule = (document: EditorDocument) => ({
  id: newId(),
  kind: "number" as const,
  pageIds: document.pages.map((page) => page.id),
  text: "BATES-",
  start: 1,
  padding: 4,
  position: "bottom" as const,
  fontSize: 12,
  color: "#173732",
  opacity: 1,
});
