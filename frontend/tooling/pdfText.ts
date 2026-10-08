import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// Node release checks use a separate PDF.js reader for downloaded content.
export async function savedPdfText(bytes: Uint8Array, pageNumber = 1) {
  const pdf = await getDocument({ data: Uint8Array.from(bytes) }).promise;
  try {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
  } finally {
    await pdf.destroy();
  }
}
