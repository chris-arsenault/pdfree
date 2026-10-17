import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PDFDocument, PDFName, PDFDict, PDFHexString, StandardFonts, rgb, degrees } from "pdf-lib";
import { PNG } from "pngjs";
import { type PDFPage, type PDFImage } from "pdf-lib";

export async function performanceFixtures() {
  const root = "test-results/performance";
  await mkdir(root, { recursive: true });
  const bytes = await readFile("tooling/fixtures/performance/r-4.6.1-reference.pdf");
  if (
    createHash("sha256").update(bytes).digest("hex") !==
    "f29391a9c09580d870caaaf4251a5a0a299e00f422e329dfeef28e51d07e907d"
  )
    throw new Error("The real-document benchmark fixture changed.");
  const source = await PDFDocument.load(bytes);
  if (source.getPageCount() !== 3993) throw new Error("Unexpected reference-manual page count.");
  removeExcerptNavigation(source);
  const files: { path: string; pages: number; profile: string }[] = [];
  for (const count of [100, 500, 2000]) {
    const pdf = await PDFDocument.create();
    fixtureDates(pdf);
    for (const page of await pdf.copyPages(
      source,
      Array.from({ length: count }, (_, i) => i)
    ))
      pdf.addPage(page);
    const path = `${root}/real-${count}.pdf`;
    await writeFile(path, await pdf.save());
    files.push({ path, pages: count, profile: "real" });
    const synthetic = `${root}/mixed-${count}.pdf`;
    await writeFile(synthetic, await mixedFixture(count));
    files.push({ path: synthetic, pages: count, profile: "mixed" });
  }
  return files;
}

function removeExcerptNavigation(source: PDFDocument) {
  // Excerpts omit named destinations and target pages. The original stays intact.
  for (const page of source.getPages()) {
    const annotations = page.node.Annots();
    if (!annotations) continue;
    for (let i = annotations.size() - 1; i >= 0; i--) {
      const annotation = annotations.lookup(i, PDFDict);
      const action = annotation.lookupMaybe(PDFName.of("A"), PDFDict);
      if (
        annotation.has(PDFName.of("Dest")) ||
        action?.get(PDFName.of("S"))?.toString() === "/GoTo"
      )
        annotations.remove(i);
    }
  }
}

async function mixedFixture(count: number) {
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  fixtureDates(pdf);
  const image = new PNG({ width: 160, height: 200 });
  for (let i = 0; i < image.data.length; i += 4) {
    const shade = Math.floor(i / 640) % 16 < 2 && i % 640 < 560 ? 40 : 250;
    image.data.set([shade, shade, shade, 255], i);
  }
  const shared = await pdf.embedPng(PNG.sync.write(image));
  const form = pdf.getForm();
  for (let i = 0; i < count; i++) {
    const page = pdf.addPage(i % 7 ? [612, 792] : [792, 612]);
    if (i % 13 === 0) page.setRotation(degrees(90));
    page.drawText(`Performance fixture page ${i + 1}`, { x: 30, y: 550, size: 16, font });
    page.drawRectangle({ x: 30, y: 400, width: 200, height: 80, borderColor: rgb(0.2, 0.4, 0.6) });
    await drawScan(pdf, page, i, image, shared);
    if (i % 100 === 0) {
      const field = form.createTextField(`field-${i + 1}`);
      field.setText(`Value ${i + 1}`);
      field.addToPage(page, { x: 30, y: 350, width: 180, height: 25 });
      page.node.addAnnot(
        pdf.context.register(
          pdf.context.obj({
            Type: "Annot",
            Subtype: "Text",
            Rect: [40, 300, 64, 324],
            Contents: PDFHexString.fromText(`Comment on page ${i + 1}`),
            T: PDFHexString.fromText("Public benchmark fixture"),
            F: 4,
          })
        )
      );
    }
  }
  return pdf.save();
}
async function drawScan(
  pdf: PDFDocument,
  page: PDFPage,
  index: number,
  image: PNG,
  shared: PDFImage
) {
  if (index % 3 !== 0) return;
  // Shared and distinct resources expose both page-count and resource scaling.
  const scan = index % 30 === 0 ? await pdf.embedPng(PNG.sync.write(image)) : shared;
  page.drawImage(scan, { x: 280, y: 100, width: 160, height: 200 });
}
function fixtureDates(pdf: PDFDocument) {
  const fixed = new Date("2026-10-17T00:00:00Z");
  pdf.setCreationDate(fixed);
  pdf.setModificationDate(fixed);
}
