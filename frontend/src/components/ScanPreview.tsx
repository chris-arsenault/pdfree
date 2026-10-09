import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { adjustPixels, type CleanupOptions, type Margins } from "../core/scanAnalysis";
import { type ScanSample } from "../services/scanSample";

type Side = keyof Margins;
const sides: Side[] = ["left", "right", "top", "bottom"];
/** Trimming always leaves at least this much of the page, in points. */
const minimumPage = 36;

/**
 * Live cleanup preview of the sample page. It applies the export's pixel
 * adjustment and rotates about the trimmed page's centre, as export does, so
 * what is shown is what Apply produces. Trim edges are draggable sliders.
 */
export function ScanPreview({
  sample,
  options,
  original,
  grid,
  onCrop,
}: {
  sample: ScanSample;
  options: CleanupOptions;
  original: boolean;
  grid: boolean;
  onCrop?: (crop: Margins) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { contrast, background } = original ? { contrast: 1, background: 0 } : options;
  const pixels = useMemo(() => {
    if (contrast === 1 && !background) return sample.pixels;
    const copy = new ImageData(
      new Uint8ClampedArray(sample.pixels.data),
      sample.pixels.width,
      sample.pixels.height
    );
    adjustPixels(copy.data, { contrast, background });
    return copy;
  }, [sample, contrast, background]);
  const crop = options.crop,
    angle = original ? 0 : options.angle;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawPreview(canvas, pixels, sample.pointsPerPixel, original ? null : crop, angle);
  }, [pixels, sample, crop, angle, original]);
  return (
    <div className={`scan-preview ${grid && !original ? "with-grid" : ""}`}>
      <canvas ref={canvasRef} aria-label={original ? "Original page" : "Cleaned page preview"} />
      {!original && (
        <div
          className="crop-window"
          style={{
            "--crop-left": `${(crop.left / sample.width) * 100}%`,
            "--crop-right": `${(crop.right / sample.width) * 100}%`,
            "--crop-top": `${(crop.top / sample.height) * 100}%`,
            "--crop-bottom": `${(crop.bottom / sample.height) * 100}%`,
          }}
        >
          {onCrop &&
            sides.map((side) => (
              <CropHandle key={side} side={side} sample={sample} crop={crop} onCrop={onCrop} />
            ))}
        </div>
      )}
    </div>
  );
}

function drawPreview(
  canvas: HTMLCanvasElement,
  pixels: ImageData,
  pointsPerPixel: number,
  crop: Margins | null,
  angle: number
) {
  const { width, height } = pixels;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  const scratch = window.document.createElement("canvas");
  try {
    scratch.width = width;
    scratch.height = height;
    scratch.getContext("2d")!.putImageData(pixels, 0, 0);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    if (crop && angle) {
      const left = crop.left / pointsPerPixel,
        right = width - crop.right / pointsPerPixel;
      const top = crop.top / pointsPerPixel,
        bottom = height - crop.bottom / pointsPerPixel;
      const x = (left + right) / 2,
        y = (top + bottom) / 2;
      // PDF angles turn counter-clockwise with y up; the canvas y axis points down.
      context.translate(x, y);
      context.rotate((-angle * Math.PI) / 180);
      context.translate(-x, -y);
    }
    context.drawImage(scratch, 0, 0);
  } finally {
    scratch.width = scratch.height = 0;
  }
}

function CropHandle({
  side,
  sample,
  crop,
  onCrop,
}: {
  side: Side;
  sample: ScanSample;
  crop: Margins;
  onCrop: (crop: Margins) => void;
}) {
  const horizontal = side === "left" || side === "right";
  const extent = horizontal ? sample.width : sample.height;
  const opposite = { left: "right", right: "left", top: "bottom", bottom: "top" }[side] as Side;
  const maximum = Math.max(0, Math.floor(extent - crop[opposite] - minimumPage));
  const set = (value: number) =>
    onCrop({ ...crop, [side]: Math.max(0, Math.min(maximum, Math.round(value * 2) / 2)) });
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const frame = event.currentTarget.closest(".scan-preview")!.getBoundingClientRect();
    const share = horizontal
      ? (event.clientX - frame.left) / frame.width
      : (event.clientY - frame.top) / frame.height;
    set(side === "left" || side === "top" ? share * extent : (1 - share) * extent);
  };
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    // Arrow keys move the edge on screen; inward for left/top means a larger trim.
    const inward = { left: "ArrowRight", right: "ArrowLeft", top: "ArrowDown", bottom: "ArrowUp" };
    const outward = { left: "ArrowLeft", right: "ArrowRight", top: "ArrowUp", bottom: "ArrowDown" };
    if (event.key === inward[side]) set(crop[side] + step);
    else if (event.key === outward[side]) set(crop[side] - step);
    else if (event.key === "Home") set(0);
    else return;
    event.preventDefault();
  };
  return (
    <div
      className={`crop-handle ${side}`}
      role="slider"
      tabIndex={0}
      aria-label={`Trim ${side} edge`}
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      aria-valuemin={0}
      aria-valuemax={maximum}
      aria-valuenow={crop[side]}
      aria-valuetext={`${crop[side]} points`}
      onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
      onPointerMove={drag}
      onKeyDown={keys}
    />
  );
}
