import { describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { unzipSync } from "fflate";
import { exportSplitArchive, splitPageIds } from "./exportBatch";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument } from "./model";

async function documentFixture() {
  const pdf = await PDFDocument.create();
  pdf.addPage([100, 200]);
  pdf.addPage([300, 400]);
  pdf.addPage([500, 600]);
  return appendSource(emptyDocument(), await importPdf(await pdf.save(), "batch.pdf"));
}
describe("worker split batch", () => {
  it("preserves group and explicitly requested page order in saved PDFs", async () => {
    const document = await documentFixture();
    const files = unzipSync(
      await exportSplitArchive(document, [[3, 1], [2]], "batch.pdf", false, null)
    );
    expect(Object.keys(files)).toEqual(["batch-01.pdf", "batch-02.pdf"]);
    expect(
      (await PDFDocument.load(files["batch-01.pdf"])).getPages().map((page) => page.getWidth())
    ).toEqual([500, 100]);
    expect(
      (await PDFDocument.load(files["batch-02.pdf"])).getPages().map((page) => page.getWidth())
    ).toEqual([300]);
  });
  it("parses each original source only once across individual-page outputs", async () => {
    const document = await documentFixture(),
      load = vi.spyOn(PDFDocument, "load");
    try {
      await exportSplitArchive(document, [[1], [2], [3]], "batch", false, null);
      expect(load).toHaveBeenCalledTimes(1);
    } finally {
      load.mockRestore();
    }
  });
  it("does not mutate the original document across split outputs", async () => {
    const document = await documentFixture(),
      snapshot = structuredClone(document);
    await exportSplitArchive(document, [[1], [3], [2]], "batch", true, null);
    expect(document).toEqual(snapshot);
  });
  it.each([
    [[], "at least one split output"],
    [[[]], "at least one page"],
    [[[1, 1]], "once per output"],
    [[[0]], "outside the document"],
    [[[4]], "outside the document"],
    [[[1.5]], "outside the document"],
  ] as const)("rejects invalid groups %j before export", async (groups, message) => {
    const document = await documentFixture();
    expect(() =>
      splitPageIds(
        document,
        groups.map((group) => [...group])
      )
    ).toThrow(message);
  });
  it("allows a page in separate outputs without sharing output identity", async () => {
    const document = await documentFixture();
    const files = unzipSync(await exportSplitArchive(document, [[1], [1]], "batch", false, null));
    expect(Object.keys(files)).toHaveLength(2);
    for (const bytes of Object.values(files))
      expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});
