import { PDFDocument } from "pdf-lib";
import { imageCanvas, imageResources, replaceImage, supportedImage } from "./pdfImages";

export type CompressionOptions = {
  preset: "original" | "screen" | "balanced" | "print";
  targetBytes: number;
};
export type CompressionResult = {
  bytes: Uint8Array;
  originalSize: number;
  processed: number;
  skipped: number;
  targetReached: boolean;
};
export async function compressPdf(
  bytes: Uint8Array,
  options: CompressionOptions,
  progress: (message: string) => void = () => {}
): Promise<CompressionResult> {
  if (options.preset === "original")
    return {
      bytes,
      originalSize: bytes.length,
      processed: 0,
      skipped: 0,
      targetReached: !options.targetBytes || bytes.length <= options.targetBytes,
    };
  if (!Number.isFinite(options.targetBytes) || options.targetBytes < 0)
    throw new Error("Choose a valid target size.");
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const images = imageResources(pdf);
  const settings = { screen: [1400, 0.6], balanced: [2200, 0.78], print: [3600, 0.9] }[
    options.preset
  ];
  let processed = 0,
    skipped = 0;
  for (const [index, image] of images.entries()) {
    progress(`Image ${index + 1} of ${images.length}`);
    if (!supportedImage(image.stream)) {
      skipped++;
      continue;
    }
    const source = await imageCanvas(image.stream);
    const ratio = Math.min(1, settings[0] / Math.max(source.width, source.height));
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.round(source.width * ratio)),
      Math.max(1, Math.round(source.height * ratio))
    );
    try {
      canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
      const encoded = new Uint8Array(
        await (
          await canvas.convertToBlob({ type: "image/jpeg", quality: settings[1] })
        ).arrayBuffer()
      );
      if (encoded.length < image.stream.contents.length) {
        replaceImage(pdf, image, encoded, canvas.width, canvas.height);
        processed++;
      }
    } finally {
      canvas.width = canvas.height = source.width = source.height = 1;
    }
  }
  const candidate = await pdf.save();
  const result = candidate.length < bytes.length ? candidate : bytes;
  return {
    bytes: result,
    originalSize: bytes.length,
    processed,
    skipped,
    targetReached: targetReached(result, options),
  };
}
function targetReached(bytes: Uint8Array, options: CompressionOptions) {
  return !options.targetBytes || bytes.length <= options.targetBytes;
}
