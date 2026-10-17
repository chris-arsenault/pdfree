import { failure } from "../i18n/messages";
export const rasterLimits = {
  viewerEdge: 4096,
  imageEdge: 8192,
  imagePixels: 32 * 1024 * 1024,
  archiveBytes: 128 * 1024 * 1024,
};

function validDimensions(width: number, height: number, scale: number) {
  if (![width, height, scale].every((value) => Number.isFinite(value) && value > 0))
    throw failure("errors.pageDimensions");
}

export function viewerRasterRatio(width: number, height: number, scale: number, ratio: number) {
  validDimensions(width, height, scale);
  if (!Number.isFinite(ratio) || ratio <= 0) throw failure("errors.displayScale");
  return Math.min(ratio, rasterLimits.viewerEdge / (Math.max(width, height) * scale));
}

export function imageRasterSize(width: number, height: number, scale = 1.5) {
  validDimensions(width, height, scale);
  const pixels = { width: Math.ceil(width * scale), height: Math.ceil(height * scale) };
  if (
    Math.max(pixels.width, pixels.height) > rasterLimits.imageEdge ||
    pixels.width * pixels.height > rasterLimits.imagePixels
  )
    throw failure("errors.pngPageLimit");
  return pixels;
}

export function imageArchiveSize(previous: number, added: number) {
  if (![previous, added].every((value) => Number.isFinite(value) && value >= 0))
    throw failure("errors.imageArchiveSize");
  const total = previous + added;
  if (total > rasterLimits.archiveBytes) throw failure("errors.imageArchiveLimit");
  return total;
}
