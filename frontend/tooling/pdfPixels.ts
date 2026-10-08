import { localPdf } from "../src/services/viewer";

export async function bitmapPixels(bytes: Uint8Array, mime = "image/png") {
  const bitmap = await createImageBitmap(new Blob([Uint8Array.from(bytes)], { type: mime }));
  const canvas = document.createElement("canvas");
  try {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function renderedPage(bytes: Uint8Array, pageNumber = 1) {
  const pdf = await localPdf(bytes),
    canvas = document.createElement("canvas");
  try {
    const page = await pdf.getPage(pageNumber),
      viewport = page.getViewport({ scale: 1 });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    await pdf.destroy();
  }
}

export function maximumDarkness(
  image: ImageData,
  rect: { x: number; y: number; width: number; height: number }
) {
  let darkest = 0;
  for (let y = Math.floor(rect.y); y < Math.ceil(rect.y + rect.height); y++)
    for (let x = Math.floor(rect.x); x < Math.ceil(rect.x + rect.width); x++) {
      const index = (y * image.width + x) * 4;
      darkest = Math.max(
        darkest,
        255 - (image.data[index] + image.data[index + 1] + image.data[index + 2]) / 3
      );
    }
  return darkest;
}
