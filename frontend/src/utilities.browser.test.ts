import { expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { appendSource, importPdf } from "./core/importPdf";
import { emptyDocument, newId, type EditorDocument } from "./core/model";
import { recognizePages } from "./services/ocr";
import { searchDocument } from "./services/navigation";
import { exportPdf } from "./core/exportPdf";
import { localPdf, viewedPage, releaseViewers } from "./services/viewer";
import { fontData } from "./services/resources";
import { runProcessingWorker } from "./services/workerClient";
import { type CompressionResult } from "./core/compressPdf";
import { type CleanupOptions } from "./core/scanCleanup";
import { formFixture } from "./core/fixtures";
import { defaultNup, nupPdf } from "./core/nupPdf";
import { writeProject, readProject } from "./core/projects";
import { batchUtilities, type BatchOutput } from "./services/batchUtilities";
async function scanFixture(text: string, pages = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 2000;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#e6e6df";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#222";
  context.font = "60px Arial";
  context.fillText(text, 160, 260);
  context.fillText("Local document processing", 160, 400);
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.98)
  );
  const pdf = await PDFDocument.create(),
    image = await pdf.embedJpg(await blob.arrayBuffer());
  for (let i = 0; i < pages; i++)
    pdf.addPage([600, 750]).drawImage(image, { x: 0, y: 0, width: 600, height: 750 });
  canvas.width = canvas.height = 0;
  return appendSource(emptyDocument(), await importPdf(await pdf.save(), "Scan.pdf"));
}
it("retains mounted scan views while the bounded cache evicts older entries", async () => {
  const document = await scanFixture("MANY SCANS", 12);
  document.pages.forEach((page) => {
    page.box = { x: 10, y: 10, width: 580, height: 730 };
  });
  const views = await Promise.all(document.pages.map((page) => viewedPage(document, page)));
  try {
    for (const view of views)
      expect((await view.page.getOperatorList()).fnArray.length).toBeGreaterThan(0);
  } finally {
    views.forEach((view) => view.release());
    releaseViewers([]);
  }
}, 30_000);
it("recognizes real scan words locally and exports searchable Unicode text without changing pixels", async () => {
  const document = await scanFixture("SEARCHABLE SCAN 12345"),
    source = document.sources[0].bytes.slice();
  const cancellation = new AbortController(),
    terminate = vi.spyOn(Worker.prototype, "terminate");
  try {
    await expect(
      recognizePages(document, [document.pages[0].id], cancellation.signal, (message) => {
        if (message.includes("loading tesseract core")) cancellation.abort();
      })
    ).rejects.toThrow(/canceled/i);
    expect(terminate).toHaveBeenCalled();
    expect(document.pages[0].recognition).toBeNull();
  } finally {
    terminate.mockRestore();
  }
  const result = await recognizePages(
    document,
    [document.pages[0].id],
    new AbortController().signal,
    () => {}
  );
  expect(result.document.pages[0].recognition!.words.map((word) => word.text).join(" ")).toContain(
    "SEARCHABLE SCAN 12345"
  );
  expect(await searchDocument(result.document, "searchable")).toHaveLength(1);
  const pdf = await localPdf(await exportPdf(result.document, false, [], await fontData()));
  try {
    const page = await pdf.getPage(1),
      text = await page.getTextContent();
    expect(
      text.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
    ).toContain("SEARCHABLE SCAN 12345");
    const reread = appendSource(
      emptyDocument(),
      await importPdf(
        await exportPdf(result.document, false, [], await fontData()),
        "Recognized.pdf"
      )
    );
    expect(
      (await recognizePages(reread, [reread.pages[0].id], new AbortController().signal, () => {}))
        .outcomes
    ).toEqual([{ pageId: reread.pages[0].id, status: "has-text" }]);
    const kept = await recognizePages(
      result.document,
      [result.document.pages[0].id],
      new AbortController().signal,
      () => {}
    );
    expect(kept.outcomes[0].status).toBe("kept");
    expect(kept.document.pages[0].recognition).toBe(result.document.pages[0].recognition);
    expect(document.sources[0].bytes).toEqual(source);
  } finally {
    await pdf.destroy();
  }
}, 120_000);
it("cleans only selected scan resources, persists geometry, and compresses supported images", async () => {
  const document = await scanFixture("CLEAN SCAN", 2),
    signal = new AbortController().signal;
  const options: CleanupOptions = {
    angle: 1,
    contrast: 1.4,
    background: 40,
    crop: { left: 10, right: 10, top: 20, bottom: 20 },
  };
  const cleaned = await runProcessingWorker<EditorDocument>(
    { kind: "cleanup", document, pages: [{ pageId: document.pages[0].id, options }] },
    signal
  );
  // Cleaning the page again replaces its processed image instead of accumulating assets.
  const recleaned = await runProcessingWorker<EditorDocument>(
    { kind: "cleanup", document: cleaned, pages: [{ pageId: cleaned.pages[0].id, options }] },
    signal
  );
  expect(recleaned.assets).toHaveLength(1);
  expect(recleaned.assets[0].id).toBe(recleaned.pages[0].scan!.assetId);
  const reopened = await readProject(writeProject(cleaned));
  expect(reopened.pages[0].scan).toEqual(cleaned.pages[0].scan);
  expect(reopened.pages[0].box).toEqual({ x: 10, y: 20, width: 580, height: 710 });
  const bytes = await exportPdf(reopened, false, [], await fontData());
  const written = await PDFDocument.load(bytes);
  const firstImage = written.getPage(0).node.Resources()!.toString(),
    secondImage = written.getPage(1).node.Resources()!.toString();
  expect(firstImage).not.toEqual(secondImage);
  const compressed = await runProcessingWorker<CompressionResult>(
    { kind: "compress", bytes, options: { preset: "screen", targetBytes: 1 } },
    signal
  );
  expect(compressed.bytes.length).toBeLessThanOrEqual(bytes.length);
  expect(compressed.processed).toBeGreaterThan(0);
  expect(compressed.targetReached).toBe(false);
  const reader = await localPdf(compressed.bytes.slice());
  try {
    expect(reader.numPages).toBe(2);
    expect((await reader.getPage(1)).view).toEqual([10, 20, 590, 730]);
  } finally {
    await reader.destroy();
  }
}, 30_000);
it("bakes current fields and note appearances into rotated, mixed-size N-up vector sheets", async () => {
  const document = appendSource(emptyDocument(), await importPdf(await formFixture(), "Forms.pdf"));
  document.pages[0].comments.push({
    id: newId(),
    annotationIndex: null,
    parentId: null,
    x: 100,
    y: 200,
    width: 24,
    height: 24,
    text: "Print note",
    author: "",
    createdAt: "",
    modifiedAt: "",
    readOnly: false,
  });
  const bytes = await nupPdf(await exportPdf(document, true, [], await fontData()), {
    ...defaultNup,
    count: 2,
  });
  const pdf = await localPdf(bytes);
  try {
    expect(pdf.numPages).toBe(2);
    const first = await pdf.getPage(1),
      text = await first.getTextContent();
    expect(text.items.map((item) => ("str" in item ? item.str : "")).join(" ")).toContain(
      "Original"
    );
    expect(await first.getAnnotations()).toEqual([]);
    expect(first.view).toEqual([0, 0, 612, 792]);
  } finally {
    await pdf.destroy();
  }
});
it("keeps successful batch outputs and numbering across a failed file with colliding names", async () => {
  const bytes = Uint8Array.from(await formFixture()),
    outputs: BatchOutput[] = [];
  await batchUtilities(
    [
      new File([bytes], "same.pdf", { type: "application/pdf" }),
      new File(["damaged"], "same.pdf", { type: "application/pdf" }),
      new File([bytes], "same.pdf", { type: "application/pdf" }),
    ],
    {
      operation: "rule",
      continuing: true,
      compression: { preset: "original", targetBytes: 0 },
      rule: {
        id: newId(),
        kind: "number",
        pageIds: [],
        text: "BATES-",
        start: 1,
        padding: 4,
        position: "bottom",
        fontSize: 12,
        color: "#173732",
        opacity: 1,
      },
    },
    new AbortController().signal,
    () => {},
    (output) => outputs.push(output)
  );
  expect(outputs.map((output) => output.name)).toEqual([
    "same-processed.pdf",
    "same-processed-2.pdf",
    "same-processed-3.pdf",
  ]);
  expect(outputs[1].bytes).toBeNull();
  const pdf = await localPdf(outputs[2].bytes!.slice());
  try {
    const page = await pdf.getPage(1);
    expect(
      (await page.getTextContent()).items.map((item) => ("str" in item ? item.str : "")).join(" ")
    ).toContain("BATES-0004");
    expect(
      (await page.getAnnotations()).find((annotation) => annotation.fieldName === "name")
        ?.fieldValue
    ).toBe("Original");
  } finally {
    await pdf.destroy();
  }
}, 30_000);
