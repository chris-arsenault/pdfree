import { type ReferenceFrame } from "../hooks/usePinnedPage";

export function referenceWidth(width: number, split: number) {
  return Math.max(280, Math.min(width - 328, width * split));
}
export function boundedFrame(frame: ReferenceFrame, size: { width: number; height: number }) {
  const width = Math.min(size.width, Math.max(300, frame.width));
  const height = Math.min(size.height, Math.max(220, frame.height));
  return {
    width,
    height,
    x: Math.max(0, Math.min(size.width - width, frame.x)),
    y: Math.max(0, Math.min(size.height - height, frame.y)),
  };
}
