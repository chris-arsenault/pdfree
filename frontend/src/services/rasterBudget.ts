export const rasterLimits = {
  viewerEdge: 4096,
  imageEdge: 8192,
  imagePixels: 32 * 1024 * 1024,
  archiveBytes: 128 * 1024 * 1024,
};

function validDimensions(width: number, height: number, scale: number) {
  if (![width, height, scale].every((value) => Number.isFinite(value) && value > 0))
    throw new Error("Page dimensions and image scale must be positive, finite numbers.");
}

export function viewerRasterRatio(width: number, height: number, scale: number, ratio: number) {
  validDimensions(width, height, scale);
  if (!Number.isFinite(ratio) || ratio <= 0) throw new Error("The display scale is invalid.");
  return Math.min(ratio, rasterLimits.viewerEdge / (Math.max(width, height) * scale));
}

export function imageRasterSize(width: number, height: number, scale = 1.5) {
  validDimensions(width, height, scale);
  const pixels = { width: Math.ceil(width * scale), height: Math.ceil(height * scale) };
  if (
    Math.max(pixels.width, pixels.height) > rasterLimits.imageEdge ||
    pixels.width * pixels.height > rasterLimits.imagePixels
  )
    throw new Error(
      "This page is too large for PNG export at 108 dpi. Export it as a PDF to retain its full resolution."
    );
  return pixels;
}

export function imageArchiveSize(previous: number, added: number) {
  if (![previous, added].every((value) => Number.isFinite(value) && value >= 0))
    throw new Error("The image archive size is invalid.");
  const total = previous + added;
  if (total > rasterLimits.archiveBytes)
    throw new Error("This PNG archive exceeds 128 MB. Export fewer pages at a time.");
  return total;
}
