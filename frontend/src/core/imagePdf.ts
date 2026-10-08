import { PDFDocument } from "pdf-lib";
import { importPdf } from "./importPdf";
export async function imagePdf(bytes: Uint8Array, name: string, mime: string) {
  const pdf = await PDFDocument.create();
  const image = mime === "image/jpeg" ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
  const scale = Math.min(1, 792 / image.height, 612 / image.width),
    width = image.width * scale,
    height = image.height * scale;
  const page = pdf.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });
  return importPdf(await pdf.save(), name.replace(/\.(png|jpe?g)$/i, ".pdf"));
}
