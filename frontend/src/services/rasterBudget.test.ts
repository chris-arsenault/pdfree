import { describe, expect, it } from "vitest";
import { imageArchiveSize, imageRasterSize, rasterLimits, viewerRasterRatio } from "./rasterBudget";

describe("viewer rendering", () => {
  it("preserves the requested density for a normal page", () => {
    expect(viewerRasterRatio(612, 792, 1, 2)).toBe(2);
  });
  it("bounds the longest edge of oversized pages", () => {
    const ratio = viewerRasterRatio(10_000, 5000, 3, 2);
    expect(10_000 * 3 * ratio).toBe(4096);
  });
  it("applies the edge bound to portrait pages as well", () => {
    const ratio = viewerRasterRatio(5000, 10_000, 1, 1);
    expect(10_000 * ratio).toBe(4096);
  });
  it("rejects invalid device-pixel density", () => {
    expect(() => viewerRasterRatio(612, 792, 1, 0)).toThrow("display scale is invalid");
  });
});
describe("PNG export allocation", () => {
  it("retains the established 108 dpi export for ordinary pages", () => {
    expect(imageRasterSize(612, 792)).toEqual({ width: 918, height: 1188 });
  });
  it("rounds fractional raster dimensions upward", () => {
    expect(imageRasterSize(10.1, 20.1, 1)).toEqual({ width: 11, height: 21 });
  });
  it("accepts the exact longest-edge limit when area is safe", () => {
    expect(imageRasterSize(rasterLimits.imageEdge, 10, 1).width).toBe(8192);
  });
  it("rejects an excessive longest edge before allocating a canvas", () => {
    expect(() => imageRasterSize(8193, 10, 1)).toThrow("too large for PNG export");
  });
  it("rejects excessive area even if each edge is below its limit", () => {
    expect(() => imageRasterSize(6000, 6000, 1)).toThrow("too large for PNG export");
  });
  it.each([
    [0, 792, 1.5],
    [612, -1, 1.5],
    [Infinity, 792, 1.5],
    [612, NaN, 1.5],
    [612, 792, 0],
  ])("rejects invalid page dimensions or scale (%s, %s, %s)", (width, height, scale) => {
    expect(() => imageRasterSize(width, height, scale)).toThrow("positive, finite numbers");
  });
});
describe("image archive budget", () => {
  it("accepts an archive exactly at the limit", () => {
    expect(imageArchiveSize(rasterLimits.archiveBytes - 10, 10)).toBe(rasterLimits.archiveBytes);
  });
  it("rejects an archive over the limit with a suggested smaller export", () => {
    expect(() => imageArchiveSize(rasterLimits.archiveBytes, 1)).toThrow(
      "Export fewer pages at a time."
    );
  });
  it("rejects invalid archive accounting", () => {
    expect(() => imageArchiveSize(0, -1)).toThrow("image archive size is invalid");
  });
});
