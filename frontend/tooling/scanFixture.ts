import { randomBytes } from "node:crypto";
import { PNG } from "pngjs";
import { PDFDocument } from "pdf-lib";
export async function scanFixture(pageCount: number) {
  const png = new PNG({ width: 600, height: 800 });
  png.data.set(randomBytes(png.data.length));
  for (let index = 3; index < png.data.length; index += 4) png.data[index] = 255;
  const bytes = PNG.sync.write(png, { colorType: 2 });
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index++) {
    const image = await pdf.embedPng(bytes),
      page = pdf.addPage([612, 792]);
    page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
  }
  return pdf.save();
}
