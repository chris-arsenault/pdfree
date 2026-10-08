import { expect, it } from "vitest";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { formFixture } from "./fixtures";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument, fieldKey, defaultObject, newId } from "./model";
import { exportPdf } from "./exportPdf";
import { fontData } from "../services/resources";
import { runPdfWorker } from "../services/workerClient";
import { createSplitArchive } from "../services/split";
import { unzipSync } from "fflate";
import { splitGroups } from "./pageRanges";
import { insertBlank, rotatePages } from "./pageOperations";
import { PDFDocument } from "pdf-lib";
import { canvasSignature } from "../services/signatures";
import { pageImages } from "../services/pageImages";
import { type EditorDocument } from "./model";
import { bitmapPixels, maximumDarkness, renderedPage } from "../../tooling/pdfPixels";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
it("independently reads selected radio appearance states after extraction and reordering", async () => {
  for (const order of [[1], [1, 0], [1, 0, 1]]) {
    const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "radio.pdf"));
    doc.values[fieldKey(doc.sources[0].id, "choice")] = "B";
    doc.pages = order.map((index) => ({ ...doc.pages[index], id: newId() }));
    const pdf = await pdfjs.getDocument({ data: await exportPdf(doc) }).promise;
    for (let index = 0; index < order.length; index++) {
      const annotations = await (await pdf.getPage(index + 1)).getAnnotations();
      const radio = annotations.find((annotation) => annotation.radioButton);
      expect(radio?.fieldValue === radio?.buttonValue).toBe(order[index] === 1);
      expect(radio?.buttonValue).toBe(order[index] === 1 ? "1" : "0");
    }
    await pdf.destroy();
  }
});
it("independently reads blank crop geometry, rotation and visible added text", async () => {
  const original = await PDFDocument.create();
  original.addPage([600, 800]).setCropBox(50, 100, 500, 650);
  let doc = appendSource(emptyDocument(), await importPdf(await original.save(), "crop.pdf"));
  doc = insertBlank(doc, doc.pages[0].id);
  doc = rotatePages(doc, [doc.pages[1].id]);
  doc.pages[1].objects.push({
    ...defaultObject("text", { x: 10, y: 610 }),
    text: "Visible near top",
  });
  const pdf = await pdfjs.getDocument({ data: await exportPdf(doc) }).promise;
  const page = await pdf.getPage(2);
  expect(page.rotate).toBe(90);
  expect(page.view).toEqual([0, 0, 500, 650]);
  const viewport = page.getViewport({ scale: 1 });
  expect(viewport.width).toBe(650);
  expect(viewport.height).toBe(500);
  const text = await page.getTextContent();
  expect(text.items.some((item) => "str" in item && item.str === "Visible near top")).toBe(true);
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;
  const pixels = canvas.getContext("2d")!.getImageData(610, 10, 35, 160).data;
  expect(Array.from(pixels).some((value, index) => index % 4 !== 3 && value < 150)).toBe(true);
  await pdf.destroy();
});
it("round trips a trimmed transparent signature image and exports rendered page PNGs", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 200;
  const context = canvas.getContext("2d")!;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(100, 70);
  context.lineTo(180, 110);
  context.lineTo(240, 60);
  context.stroke();
  const asset = await canvasSignature(canvas);
  const signature = await bitmapPixels(asset.data, asset.mime);
  expect(signature.width).toBeLessThan(200);
  expect(signature.height).toBeLessThan(100);
  expect(signature.data[3]).toBe(0);
  expect(signature.data[signature.data.length - 1]).toBe(0);
  const inkPixels = Array.from(signature.data).filter(
    (value, index) => index % 4 === 3 && value > 200
  );
  expect(inkPixels.length).toBeGreaterThan(300);
  expect(inkPixels.length).toBeLessThan((signature.width * signature.height) / 4);
  const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "image.pdf"));
  doc.assets.push(asset);
  doc.pages[0].objects.push({
    ...defaultObject("image", { x: 50, y: 200 }),
    assetId: asset.id,
    width: 180,
    height: 70,
  });
  const archive = await runPdfWorker<Uint8Array>({ kind: "project-save", document: doc });
  const restored = await runPdfWorker<EditorDocument>({ kind: "project-open", bytes: archive });
  expect(restored.pages[0].objects[0].assetId).toBe(asset.id);
  expect(restored.assets[0].data).toEqual(asset.data);
  const region = { x: 50, y: 522, width: 180, height: 70 };
  const filled = await renderedPage(await exportPdf(restored));
  expect(maximumDarkness(filled, region)).toBeGreaterThan(200);
  const omitted = { ...restored, pages: restored.pages.map((page) => ({ ...page, objects: [] })) };
  expect(maximumDarkness(await renderedPage(await exportPdf(omitted)), region)).toBe(0);
  const files = unzipSync(await pageImages(restored, [restored.pages[0].id]));
  expect(Object.keys(files)).toEqual(["page-001.png"]);
  const png = await bitmapPixels(files["page-001.png"]);
  expect(png.width).toBe(918);
  expect(png.height).toBe(1188);
  expect(maximumDarkness(png, { x: 75, y: 783, width: 270, height: 105 })).toBeGreaterThan(200);
  const imported = await runPdfWorker<Awaited<ReturnType<typeof importPdf>>>({
    kind: "image-pdf",
    bytes: files["page-001.png"],
    name: "scan.png",
    mime: "image/png",
  });
  expect(imported.pages).toHaveLength(1);
  expect(imported.pages[0].box.width).toBeCloseTo(612);
  const rescanned = await renderedPage(await exportPdf(appendSource(emptyDocument(), imported)));
  expect(maximumDarkness(rescanned, region)).toBeGreaterThan(200);
});
it("independently renders exported fields and original text using PDF.js", async () => {
  const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "fixture.pdf"));
  doc.values[fieldKey(doc.sources[0].id, "name")] = "Grace Hopper";
  doc.pages[0].objects.push({
    ...defaultObject("text", { x: 48, y: 300 }),
    text: "Handwritten initials",
    font: "signature",
    width: 240,
  });
  doc.pages[0].objects.push({
    ...defaultObject("ink", { x: 60, y: 250 }),
    points: [
      { x: 0, y: 0 },
      { x: 0.5, y: 1 },
      { x: 1, y: 0.3 },
    ],
  });
  const bytes = await exportPdf(doc, true, [], await fontData());
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const text = await page.getTextContent();
  expect(text.items.map((item) => ("str" in item ? item.str : "")).join(" ")).toContain(
    "Grace Hopper"
  );
  expect(text.items.map((item) => ("str" in item ? item.str : "")).join(" ")).toContain(
    "Handwritten initials"
  );
  await pdf.destroy();
  const rendered = await renderedPage(await exportPdf(doc, true, [], await fontData()));
  for (const [index, region] of [
    { x: 48, y: 464, width: 240, height: 28 },
    { x: 58, y: 512, width: 154, height: 32 },
  ].entries()) {
    expect(maximumDarkness(rendered, region)).toBeGreaterThan(150);
    const omitted = {
      ...doc,
      pages: doc.pages.map((page) => ({
        ...page,
        objects: page.objects.filter((_, i) => i !== index),
      })),
    };
    const negative = await renderedPage(await exportPdf(omitted, true, [], await fontData()));
    expect(maximumDarkness(negative, region)).toBe(0);
  }
});
it("exports accented text and typed signatures through the real browser worker", async () => {
  const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "local.pdf"));
  doc.values[fieldKey(doc.sources[0].id, "name")] = "Zoë García Ελληνικά";
  doc.pages[0].objects.push({
    ...defaultObject("text", { x: 48, y: 300 }),
    text: "Local signature",
    font: "signature",
    width: 240,
  });
  const bytes = await runPdfWorker<Uint8Array>({
    kind: "export",
    document: doc,
    flatten: true,
    pageIds: [],
    fonts: await fontData(),
  });
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const text = await (await pdf.getPage(1)).getTextContent();
  const content = text.items.map((item) => ("str" in item ? item.str : "")).join(" ");
  expect(content).toContain("Zoë García Ελληνικά");
  expect(content).toContain("Local signature");
  await pdf.destroy();
});
it("splits current pages into named PDFs retaining rotations, fields and added text", async () => {
  let doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "split.pdf"));
  doc.values[fieldKey(doc.sources[0].id, "name")] = "Current value";
  doc.pages[1].objects.push({
    ...defaultObject("text", { x: 50, y: 300 }),
    text: "Second page edit",
  });
  doc = rotatePages(doc, [doc.pages[1].id]);
  const files = unzipSync(
    await createSplitArchive(doc, splitGroups("after", "1", 3), "part", true)
  );
  expect(Object.keys(files)).toEqual(["part-01.pdf", "part-02.pdf"]);
  const second = await pdfjs.getDocument({ data: files["part-02.pdf"] }).promise;
  expect(second.numPages).toBe(2);
  const page = await second.getPage(1);
  expect(page.rotate).toBe(90);
  const content = (await page.getTextContent()).items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
  expect(content).toContain("Current value");
  expect(content).toContain("Second page edit");
  expect(content).toContain("Sample page 2");
  await second.destroy();
});
