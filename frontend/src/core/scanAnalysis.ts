/** Crop margins in PDF points, measured inward from the original visible page box. */
export type Margins = { left: number; right: number; top: number; bottom: number };
export type CleanupOptions = {
  angle: number;
  contrast: number;
  background: number;
  crop: Margins;
};
export const noCleanup: CleanupOptions = {
  angle: 0,
  contrast: 1,
  background: 0,
  crop: { left: 0, right: 0, top: 0, bottom: 0 },
};
/** A rendered page reduced to one 8-bit level per pixel, rows top to bottom. */
export type Levels = { data: Uint8Array; width: number; height: number };
export type ScanAnalysis = {
  /** Counter-clockwise correction in degrees; null when no text lines could be measured. */
  angle: number | null;
  /** Typical paper and ink levels (0 black – 255 white) and the paper's grain. */
  paper: number;
  ink: number;
  noise: number;
  /** Share of the page covered by ink-dark pixels. */
  coverage: number;
  /** Large mid-tone areas such as photographs or shading. */
  photo: boolean;
  blank: boolean;
  /** Recommended pixel settings for the scan image. */
  contrast: number;
  /** Whitening alongside the recommended contrast, which already brightens paper. */
  background: number;
  /** Whitening when the contrast boost is switched off. */
  backgroundAlone: number;
  /** Dark scanner edges to trim, in PDF points, as scanned and after straightening. */
  crop: Margins;
  straightCrop: Margins;
};

const maxAngle = 10;

/**
 * Applies cleanup to RGBA pixels: contrast pivots on mid-grey, then any channel
 * brighter than the background threshold becomes paper white. Export and the
 * live preview share this so the preview shows the saved result.
 */
export function adjustPixels(
  data: Uint8ClampedArray,
  options: Pick<CleanupOptions, "contrast" | "background">
) {
  for (let index = 0; index < data.length; index += 4)
    for (let channel = 0; channel < 3; channel++) {
      let value = (data[index + channel] - 128) * options.contrast + 128;
      if (options.background && value > 255 - options.background) value = 255;
      data[index + channel] = value;
    }
}

/**
 * Uses the darkest channel of each pixel: tinted paper is bright in at least one
 * channel but cleanup must whiten every channel, so the darkest one decides.
 */
export function pixelLevels(rgba: Uint8ClampedArray, width: number, height: number): Levels {
  const data = new Uint8Array(width * height);
  for (let pixel = 0; pixel < data.length; pixel++) {
    const offset = pixel * 4;
    data[pixel] = Math.min(rgba[offset], rgba[offset + 1], rgba[offset + 2]);
  }
  return { data, width, height };
}

/** Measures a rendered scan; `pointsPerPixel` converts detected edges into PDF points. */
export function analyzeScan(levels: Levels, pointsPerPixel: number): ScanAnalysis {
  const edges = darkEdges(levels);
  const interior = histogram(levels, edges);
  const paper = paperLevel(interior.counts);
  const noise = paperNoise(interior.counts, paper);
  const darkLimit = paper - Math.max(40, 6 * noise);
  const ink = inkLevel(interior.counts, darkLimit, interior.total, paper);
  const dark = countBelow(interior.counts, darkLimit);
  const coverage = interior.total ? dark / interior.total : 0;
  const blank = coverage < 0.0005;
  // Text scans are mostly paper; photographs and shading spread across mid-tones.
  const photo =
    !blank &&
    (midtoneShare(interior.counts, ink, paper, interior.total) > 0.15 ||
      paperShare(interior.counts, paper, noise, interior.total) < 0.35);
  const contrast = recommendedContrast(ink, photo, blank);
  const angle = blank || photo ? null : skewAngle(levels, edges, (paper + ink) / 2);
  return {
    angle,
    paper,
    ink,
    noise,
    coverage,
    photo,
    blank,
    contrast,
    background: recommendedBackground(paper, ink, noise, contrast, photo),
    backgroundAlone: recommendedBackground(paper, ink, noise, 1, photo),
    crop: marginPoints(edges, pointsPerPixel),
    // Straightening turns edge bands into wedges, so measure them on the straightened page.
    straightCrop: angle
      ? marginPoints(darkEdges(rotateLevels(levels, angle)), pointsPerPixel)
      : marginPoints(edges, pointsPerPixel),
  };
}
const marginPoints = (edges: Margins, pointsPerPixel: number): Margins => ({
  left: points(edges.left, pointsPerPixel),
  right: points(edges.right, pointsPerPixel),
  top: points(edges.top, pointsPerPixel),
  bottom: points(edges.bottom, pointsPerPixel),
});

export type Corrections = {
  straighten: boolean;
  contrast: boolean;
  background: boolean;
  trim: boolean;
};
export const recommendedOptions = (analysis: ScanAnalysis): CleanupOptions => ({
  angle: analysis.angle ?? 0,
  contrast: analysis.contrast,
  background: analysis.background,
  crop: analysis.straightCrop,
});
/** Keeps only the corrections the user enabled; the rest become no-ops. */
export function enabledOptions(options: CleanupOptions, enabled: Corrections): CleanupOptions {
  return {
    angle: enabled.straighten ? options.angle : 0,
    contrast: enabled.contrast ? options.contrast : 1,
    background: enabled.background ? options.background : 0,
    crop: enabled.trim ? options.crop : { ...noCleanup.crop },
  };
}
/** Detected settings with the enabled corrections, each sized for the others in effect. */
export const analyzedOptions = (analysis: ScanAnalysis, enabled: Corrections) =>
  enabledOptions(
    {
      angle: analysis.angle ?? 0,
      contrast: analysis.contrast,
      background: enabled.contrast ? analysis.background : analysis.backgroundAlone,
      crop: enabled.straighten ? analysis.straightCrop : analysis.crop,
    },
    enabled
  );

/** Neutralizes corrections a page cannot take; reasons are empty when supported. */
export function supportedOptions(
  options: CleanupOptions,
  support: { image: string; straighten: string }
): CleanupOptions {
  return {
    ...options,
    angle: support.straighten ? 0 : options.angle,
    contrast: support.image ? 1 : options.contrast,
    background: support.image ? 0 : options.background,
  };
}
export const hasCrop = (crop: Margins) => Object.values(crop).some((value) => value > 0);
/** Counts the pages each correction changes, for reporting what a run did. */
export function cleanupSummary(options: CleanupOptions[]) {
  return {
    straightened: options.filter((item) => item.angle).length,
    darkened: options.filter((item) => item.contrast !== 1).length,
    whitened: options.filter((item) => item.background).length,
    trimmed: options.filter((item) => hasCrop(item.crop)).length,
  };
}

const points = (pixels: number, pointsPerPixel: number) =>
  pixels ? Math.round(pixels * pointsPerPixel * 2) / 2 : 0;

/**
 * Dark bands along the page edges, typically the scanner lid or bed. A line
 * belongs to the band while it holds an unbroken dark run of at least a twelfth
 * of the page: body text does not form such runs, while a band does even when
 * straightening has turned it into a wedge. The band must touch the edge and
 * may cover at most 20% of the page.
 */
function darkEdges(levels: Levels): Margins {
  const { width, height } = levels;
  const paper = paperLevel(histogram(levels, { left: 0, right: 0, top: 0, bottom: 0 }).counts);
  const limit = paper * 0.6;
  const row = (y: number) => darkRun(levels, limit, 0, y, 1, 0, width) >= width / 12;
  const column = (x: number) => darkRun(levels, limit, x, 0, 0, 1, height) >= height / 12;
  const band = (size: number, dark: (index: number) => boolean) => {
    let index = 0;
    while (index < Math.floor(size * 0.2) && dark(index)) index++;
    return index ? index + Math.ceil(size * 0.004) + 1 : 0;
  };
  return {
    top: band(height, row),
    bottom: band(height, (index) => row(height - 1 - index)),
    left: band(width, column),
    right: band(width, (index) => column(width - 1 - index)),
  };
}
/** Longest run of consecutive pixels darker than `limit` along one row or column. */
function darkRun(
  levels: Levels,
  limit: number,
  x: number,
  y: number,
  dx: number,
  dy: number,
  length: number
) {
  let run = 0,
    longest = 0;
  for (let step = 0; step < length; step++) {
    run = levels.data[(y + dy * step) * levels.width + x + dx * step] < limit ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}
/**
 * Rotates levels counter-clockwise (PDF orientation) about the centre, filling
 * uncovered corners with paper white as the straightened page shows them.
 */
function rotateLevels(levels: Levels, degrees: number): Levels {
  const { width, height } = levels,
    data = new Uint8Array(width * height).fill(255);
  const radians = (degrees * Math.PI) / 180,
    cos = Math.cos(radians),
    sin = Math.sin(radians);
  const cx = (width - 1) / 2,
    cy = (height - 1) / 2;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      // With y pointing down, a counter-clockwise turn on screen samples the source clockwise.
      const dx = x - cx,
        dy = y - cy;
      const sx = Math.round(cos * dx - sin * dy + cx),
        sy = Math.round(sin * dx + cos * dy + cy);
      if (sx >= 0 && sy >= 0 && sx < width && sy < height)
        data[y * width + x] = levels.data[sy * width + sx];
    }
  return { data, width, height };
}
function histogram(levels: Levels, edges: Margins) {
  const counts = new Uint32Array(256);
  let total = 0;
  for (let y = edges.top; y < levels.height - edges.bottom; y++)
    for (let x = edges.left; x < levels.width - edges.right; x++) {
      counts[levels.data[y * levels.width + x]]++;
      total++;
    }
  return { counts, total };
}
/** The most common bright level, smoothed so JPEG grain does not split the peak. */
function paperLevel(counts: Uint32Array) {
  let best = 255,
    bestCount = -1;
  for (let level = 96; level < 256; level++) {
    let sum = 0;
    for (let offset = -3; offset <= 3; offset++) sum += counts[level + offset] ?? 0;
    if (sum >= bestCount) {
      best = level;
      bestCount = sum;
    }
  }
  return best;
}
/** Paper grain from the dark side of the paper peak; the bright side may be clipped at 255. */
function paperNoise(counts: Uint32Array, paper: number) {
  const half = counts[paper] / 2;
  let level = paper;
  while (level > 0 && counts[level] > half) level--;
  return Math.max(1, (paper - level) / 1.177);
}
function countBelow(counts: Uint32Array, limit: number) {
  let sum = 0;
  for (let level = 0; level < Math.min(256, limit); level++) sum += counts[level];
  return sum;
}
/** Ink core level: antialiased glyph edges are mid-tones, so use the darker fifth of ink pixels. */
function inkLevel(counts: Uint32Array, limit: number, total: number, paper: number) {
  const dark = countBelow(counts, limit);
  if (!total || dark / total < 0.0005) return paper;
  let seen = 0;
  for (let level = 0; level < 256; level++) {
    seen += counts[level];
    if (seen >= dark * 0.2) return level;
  }
  return paper;
}
function paperShare(counts: Uint32Array, paper: number, noise: number, total: number) {
  const reach = Math.max(12, Math.ceil(3 * noise));
  let sum = 0;
  for (let level = Math.max(0, paper - reach); level <= Math.min(255, paper + reach); level++)
    sum += counts[level];
  return total ? sum / total : 0;
}
function midtoneShare(counts: Uint32Array, ink: number, paper: number, total: number) {
  const span = paper - ink,
    low = Math.ceil(ink + span * 0.3),
    high = Math.floor(paper - span * 0.3);
  let sum = 0;
  for (let level = low; level <= high; level++) sum += counts[level];
  return total ? sum / total : 0;
}
/** Darkens faded ink toward near-black; photographs only get a gentle boost. */
function recommendedContrast(ink: number, photo: boolean, blank: boolean) {
  if (blank || ink <= 60) return 1;
  const needed = (128 - 25) / Math.max(1, 128 - ink);
  const value = Math.min(photo ? 1.3 : 2.5, Math.max(1, needed));
  return Math.round(value * 20) / 20;
}
/**
 * Places the whitening threshold just under the paper after contrast, allowing
 * three grain widths, but never within the darker half between ink and paper.
 */
function recommendedBackground(
  paper: number,
  ink: number,
  noise: number,
  contrast: number,
  photo: boolean
) {
  if (photo) return 0;
  const adjust = (value: number) => (value - 128) * contrast + 128;
  const shownPaper = Math.min(255, adjust(paper)),
    shownInk = Math.max(0, adjust(ink));
  const threshold = Math.max(
    shownPaper - 3 * noise * contrast - 4,
    shownInk + (shownPaper - shownInk) * 0.5
  );
  // Paper that is already white with little grain gains nothing from whitening.
  if (shownPaper - 2 * noise * contrast >= 246) return 0;
  return Math.max(0, Math.min(100, Math.round(255 - threshold)));
}

/**
 * Projection-profile deskew: rotate the ink pixels by each candidate angle and
 * keep the angle whose row histogram has the sharpest transitions, which is
 * where text lines are horizontal. Returns null for pages without line structure.
 */
function inkPoints(levels: Levels, edges: Margins, threshold: number) {
  const xs: number[] = [],
    ys: number[] = [];
  const area =
    (levels.width - edges.left - edges.right) * (levels.height - edges.top - edges.bottom);
  const stride = Math.max(1, Math.round(Math.sqrt(area / 1_500_000)));
  for (let y = edges.top; y < levels.height - edges.bottom; y += stride)
    for (let x = edges.left; x < levels.width - edges.right; x += stride)
      if (levels.data[y * levels.width + x] < threshold) {
        xs.push(x);
        // PDF coordinates point up; the stored angle rotates counter-clockwise in them.
        ys.push(levels.height - 1 - y);
      }
  return { xs, ys, stride };
}
function skewAngle(levels: Levels, edges: Margins, threshold: number) {
  const { xs, ys, stride } = inkPoints(levels, edges, threshold);
  if (xs.length < 500) return null;
  const step = Math.max(1, Math.floor(xs.length / 120_000));
  // Rotated rows stay within ±diagonal of the origin; one buffer serves every angle.
  const reach = Math.ceil(Math.hypot(levels.width, levels.height) / stride) + 1;
  const bins = new Uint32Array(reach * 2 + 2);
  const score = (degrees: number) => profileSharpness(xs, ys, step, degrees, stride, bins, reach);
  const coarse: { angle: number; score: number }[] = [];
  for (let angle = -maxAngle; angle <= maxAngle + 1e-9; angle += 0.25)
    coarse.push({ angle, score: score(angle) });
  let best = coarse.reduce((top, item) => (item.score > top.score ? item : top), coarse[0]);
  for (let angle = best.angle - 0.3; angle <= best.angle + 0.3 + 1e-9; angle += 0.02) {
    const value = score(angle);
    if (value > best.score) best = { angle, score: value };
  }
  const sorted = coarse.map((item) => item.score).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (!median || best.score / median < 1.15) return null;
  const angle = Math.round(Math.max(-maxAngle, Math.min(maxAngle, best.angle)) * 20) / 20;
  return Math.abs(angle) < 0.1 ? 0 : angle;
}
function profileSharpness(
  xs: number[],
  ys: number[],
  step: number,
  degrees: number,
  stride: number,
  bins: Uint32Array,
  reach: number
) {
  const radians = (degrees * Math.PI) / 180,
    sin = Math.sin(radians) / stride,
    cos = Math.cos(radians) / stride;
  bins.fill(0);
  for (let index = 0; index < xs.length; index += step)
    bins[Math.round(xs[index] * sin + ys[index] * cos) + reach]++;
  let previous = 0,
    sum = 0;
  for (const count of bins) {
    sum += (count - previous) ** 2;
    previous = count;
  }
  return sum;
}
