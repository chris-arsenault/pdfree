import { describe, expect, it } from "vitest";
import {
  adjustPixels,
  analyzeScan,
  analyzedOptions,
  pixelLevels,
  type Levels,
} from "./scanAnalysis";

/** Deterministic grain so tests do not depend on Math.random. */
function grain(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) & 0x7fffffff;
    return state / 0x7fffffff - 0.5;
  };
}
type Scan = {
  tilt: number;
  paper: number;
  ink: number;
  noise: number;
  border: { left: number; top: number };
};
const width = 900,
  height = 1100;
/**
 * Upright mask of word-shaped ink blocks, 12px tall on lines 28px apart. Drawing
 * the mask once keeps generation linear in pixels, which matters under coverage.
 */
function words() {
  const mask = new Uint8Array(width * height);
  const wordRandom = grain(11);
  for (let line = 120; line < height - 120; line += 28)
    for (let x = 100; x < width - 160;) {
      const w = 30 + Math.floor((wordRandom() + 0.5) * 70);
      for (let y = line; y < line + 12; y++) mask.fill(1, y * width + x, y * width + x + w);
      x += w + 14;
    }
  return mask;
}
/**
 * A synthetic text scan tilted counter-clockwise (in PDF orientation) by
 * `tilt` degrees about the centre, with optional dark scanner edges.
 */
function textScan(options: Partial<Scan>): Levels {
  const { tilt, paper, ink, noise, border }: Scan = {
    tilt: 0,
    paper: 245,
    ink: 30,
    noise: 2,
    border: { left: 0, top: 0 },
    ...options,
  };
  const random = grain(7),
    data = new Uint8Array(width * height),
    mask = words();
  const radians = (-tilt * Math.PI) / 180,
    cos = Math.cos(radians),
    sin = Math.sin(radians);
  for (let row = 0; row < height; row++)
    for (let x = 0; x < width; x++) {
      // Undo the tilt in PDF (y-up) coordinates to find the unrotated position.
      const dx = x - width / 2,
        dy = height - 1 - row - height / 2;
      const ux = dx * cos - dy * sin + width / 2,
        uy = height - 1 - (dx * sin + dy * cos + height / 2);
      const mx = Math.floor(ux),
        my = Math.floor(uy);
      const inked = mx >= 0 && my >= 0 && mx < width && my < height && mask[my * width + mx] === 1;
      let level = (inked ? ink : paper) + random() * noise * 2;
      if (x < border.left || row < border.top) level = 15 + random() * 6;
      data[row * width + x] = Math.max(0, Math.min(255, Math.round(level)));
    }
  return { data, width, height };
}

describe("scan analysis", () => {
  it.each([2.5, -4, 7.5])("detects a %d° tilt and returns its correction", (tilt) => {
    const analysis = analyzeScan(textScan({ tilt }), 0.5);
    expect(analysis.angle).not.toBeNull();
    expect(Math.abs(analysis.angle! + tilt)).toBeLessThanOrEqual(0.15);
  });

  it("leaves a clean, straight, white scan unchanged", () => {
    const analysis = analyzeScan(textScan({ paper: 252, noise: 1, ink: 20 }), 0.5);
    expect(analysis.angle).toBe(0);
    expect(analysis.contrast).toBe(1);
    expect(analysis.background).toBe(0);
    expect(analysis.crop).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
    expect(analysis.blank).toBe(false);
    expect(analysis.photo).toBe(false);
  });

  it("whitens grey paper and darkens faded ink without erasing it", () => {
    const analysis = analyzeScan(textScan({ paper: 200, ink: 95, noise: 6 }), 0.5);
    expect(analysis.paper).toBeGreaterThan(190);
    expect(analysis.contrast).toBeGreaterThan(1.5);
    expect(analysis.background).toBeGreaterThan(0);
    const pixels = new Uint8ClampedArray([200, 200, 200, 255, 95, 95, 95, 255]);
    adjustPixels(pixels, analysis);
    expect(pixels[0]).toBe(255);
    expect(pixels[4]).toBeLessThan(50);
  });

  it("trims dark scanner edges in PDF points", () => {
    const analysis = analyzeScan(textScan({ border: { left: 40, top: 24 } }), 0.5);
    expect(analysis.crop.left).toBeGreaterThanOrEqual(20);
    expect(analysis.crop.left).toBeLessThan(24);
    expect(analysis.crop.top).toBeGreaterThanOrEqual(12);
    expect(analysis.crop.top).toBeLessThan(16);
    expect(analysis.crop.right).toBe(0);
    expect(analysis.crop.bottom).toBe(0);
    expect(analysis.angle).toBe(0);
  });

  it("widens the trim when straightening turns a scanner edge into a wedge", () => {
    const analysis = analyzeScan(textScan({ tilt: 3, border: { left: 40, top: 0 } }), 0.5);
    expect(analysis.crop.left).toBeGreaterThanOrEqual(20);
    // Rotating 3° about the centre moves the edge band by about 550px × sin 3° ≈ 29px.
    expect(analysis.straightCrop.left).toBeGreaterThan(analysis.crop.left + 10);
    expect(analysis.straightCrop.top + analysis.straightCrop.bottom).toBe(0);
  });

  it("whitens grey paper itself when the contrast boost is switched off", () => {
    const analysis = analyzeScan(textScan({ paper: 190, ink: 98, noise: 3 }), 0.5);
    expect(analysis.backgroundAlone).toBeGreaterThan(0);
    const alone = analyzedOptions(analysis, {
      straighten: true,
      contrast: false,
      background: true,
      trim: true,
    });
    expect(alone.contrast).toBe(1);
    expect(alone.background).toBe(analysis.backgroundAlone);
  });

  it("does not whiten or straighten photographs and recognises blank pages", () => {
    const width = 400,
      height = 500,
      data = new Uint8Array(width * height);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) data[y * width + x] = Math.round((x / width) * 255);
    const photo = analyzeScan({ data, width, height }, 1);
    expect(photo.photo).toBe(true);
    expect(photo.background).toBe(0);
    expect(photo.angle).toBeNull();
    const blank = analyzeScan({ data: new Uint8Array(width * height).fill(250), width, height }, 1);
    expect(blank.blank).toBe(true);
    expect(blank.angle).toBeNull();
    expect(blank.contrast).toBe(1);
  });

  it("uses the darkest channel so tinted paper is whitened in every channel", () => {
    const rgba = new Uint8ClampedArray([240, 230, 190, 255]);
    expect(pixelLevels(rgba, 1, 1).data[0]).toBe(190);
  });

  it("keeps only enabled corrections", () => {
    const analysis = analyzeScan(
      textScan({ tilt: 3, paper: 210, border: { left: 30, top: 0 } }),
      1
    );
    const options = analyzedOptions(analysis, {
      straighten: false,
      contrast: true,
      background: false,
      trim: true,
    });
    expect(options.angle).toBe(0);
    expect(options.background).toBe(0);
    expect(options.crop.left).toBeGreaterThan(0);
  });
});
